import { Jovo, JovoError, AnyObject } from '@jovotech/framework';
import { PlayFabPluginConfig, ProfileInfo } from './PlayFabPlugin';
import { PlayFab, PlayFabAdmin, PlayFabServer } from 'playfab-sdk';
import { promisify } from 'util';

export enum LoginStatus {
  NewUser = 'newUser',
  ExistingUser = 'existingUser',
  Error = 'error',
}

export enum UserDataPermission {
  Private = 'Private',
  Public = 'Public',
}

export interface UserDataRecord {
  LastUpdated: string;
  Permission?: string;
  Value?: string;
}

enum ApiStatus {
  OK = 'OK',
}

type StringObject = Record<string, string | null>;
type UserDataRecordObject = Record<string, UserDataRecord>;

export class JovoPlayFab {
  constructor(readonly config: PlayFabPluginConfig, readonly jovo: Jovo) {}

  get PlayFabServer() {
    return PlayFabServer;
  }

  get PlayFabAdmin() {
    return PlayFabAdmin;
  }

  get PlayFabId(): string {
    return this.jovo.$session.data?.playfab?.loginInfo?.PlayFabId ?? '';
  }

  init(): void {
    PlayFab.settings.titleId = this.config.titleId;
    PlayFab.settings.developerSecretKey = this.config.developerSecretKey;

    if (!this.jovo.$session.data.playfab) {
      this.jovo.$session.data.playfab = {};
    }

    if (!this.jovo.$session.data.playfab.profile) {
      this.jovo.$session.data.playfab.profile = {};
    }
  }

  async login(): Promise<void> {
    console.debug('JovoPlayFab.login');
    if (!this.jovo.$session.data?.playfab?.loginInfo?.SessionTicket) {
      const loginRequest: any = {
        ServerCustomId: this.jovo.$user.id,
        CreateAccount: true,
        CustomTags: { sessionId: this.jovo.$request.getSessionId() },
        InfoRequestParameters: this.config.login.infoRequestParameters,
      };

      const loginWithCustomID = promisify(PlayFabServer.LoginWithServerCustomId);

      try {
        const result = await loginWithCustomID(loginRequest);

        if (result.status === ApiStatus.OK) {
          this.jovo.$session.data.playfab.loginInfo = result.data;

          if (result.data.NewlyCreated) {
            // new player
            this.jovo.$session.data.playfab.loginStatus = LoginStatus.NewUser;

            if (this.config.login.onNewProfile) {
              const profile = await this.config.login.onNewProfile(this.jovo);

              await this.updateProfile(profile);

              if (!this.jovo.$session.data.playfab.isDisplayNameUpdated) {
                // display name conflict
                let count = 0;

                do {
                  count++;
                  const profile = await this.config.login.onNewProfile(this.jovo);

                  await this.updateProfile({ displayName: profile.displayName });
                } while (
                  count < this.config.login.maxNewProfileRetries &&
                  !this.jovo.$session.data.playfab.isDisplayNameUpdated
                );
              }
            }
          } else {
            // existing player
            this.jovo.$session.data.playfab.loginStatus = LoginStatus.ExistingUser;

            const profile = {
              displayName: result.data.InfoResultPayload?.PlayerProfile?.DisplayName,
              avatarUrl: result.data.InfoResultPayload?.PlayerProfile?.AvatarUrl,
            } as ProfileInfo;

            const key = this.config.login.extendedProfileKey;
            if (key) {
              let data: StringObject | null;

              if (this.jovo.$session.data.playfab.loginInfo.InfoResultPayload?.UserData?.[key]) {
                data = this.parseUserDataRecords(
                  this.jovo.$session.data.playfab.loginInfo.InfoResultPayload?.UserData,
                );
              } else {
                data = await this.getUserData(key);
              }

              if (data && data[key]) {
                profile.extendedProfile = data[key];
              }
            }

            this.jovo.$session.data.playfab.profile = profile;
          }
        }
      } catch (error) {
        console.error('PlayFabServer.LoginWithCustomID', error);
        this.jovo.$session.data.playfab.loginStatus = LoginStatus.Error;
      }
    }
  }

  async updateProfile(profile: ProfileInfo): Promise<boolean> {
    console.debug('JovoPlayFab.updateProfile');
    let result = false;

    const updateUserTitleDisplayName = promisify(PlayFabAdmin.UpdateUserTitleDisplayName);
    const updateAvatarUrl = promisify(PlayFabServer.UpdateAvatarUrl);
    const promises = [];

    if (!profile.displayName && !profile.avatarUrl) {
      return result;
    }

    if (profile.displayName) {
      const updateUserTitleDisplayNamePromise = updateUserTitleDisplayName({
        PlayFabId: this.PlayFabId,
        DisplayName: profile.displayName,
      });
      promises.push(updateUserTitleDisplayNamePromise);
    }

    if (profile.avatarUrl) {
      const updateAvatarUrlPromise = updateAvatarUrl({
        PlayFabId: this.PlayFabId,
        ImageUrl: profile.avatarUrl,
      });
      promises.push(updateAvatarUrlPromise);
    }

    const results = await Promise.allSettled(promises);
    let successCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.status === ApiStatus.OK) {
          successCount++;
          if ((result.value.data as any).DisplayName) {
            profile.displayName = (result.value.data as any).DisplayName;
            this.jovo.$session.data.playfab.isDisplayNameUpdated = true;
          }
        }
      } else {
        // rejected
        if (result.reason.error === 'NameNotAvailable') {
          this.jovo.$session.data.playfab.isDisplayNameUpdated = false;
        }
      }
    }

    if (successCount > 0) {
      this.jovo.$session.data.playfab.profile = profile;
      result = true;

      if (profile.extendedProfile && this.config.login.extendedProfileKey) {
        const data = {
          [this.config.login.extendedProfileKey]: profile.extendedProfile,
        };

        await this.updateUserData(data);
      }
    }

    return result;
  }

  async updateStat(statName: string, value: number): Promise<boolean> {
    console.debug('JovoPlayFab.updateStat');

    const updatePlayerStatisticsRequest = {
      PlayFabId: this.PlayFabId,
      Statistics: [
        {
          StatisticName: statName,
          Value: value,
          CustomTags: { sessionId: this.jovo.$request.getSessionId() },
        },
      ],
    };
    const updatePlayerStatistics = promisify(PlayFabServer.UpdatePlayerStatistics);

    try {
      const result = await updatePlayerStatistics(updatePlayerStatisticsRequest);
      console.debug('PlayFabServer.UpdatePlayerStatistics', JSON.stringify(result, null, 2));

      return true;
    } catch (error) {
      console.error('PlayFabServer.UpdatePlayerStatistics', error);
    }

    return false;
  }

  async getStat(statName: string): Promise<number | null> {
    let value: number | null = null;

    const getPlayerStatisticsRequest = {
      PlayFabId: this.PlayFabId,
      StatisticNames: [statName],
    };
    const getPlayerStatistics = promisify(PlayFabServer.GetPlayerStatistics);

    try {
      const result = await getPlayerStatistics(getPlayerStatisticsRequest);
      console.debug('PlayFabServer.GetPlayerStatistics', JSON.stringify(result, null, 2));

      if (
        result.status === ApiStatus.OK &&
        result.data.Statistics &&
        result.data.Statistics.length > 0
      ) {
        value = result.data.Statistics[0].Value;
      }
    } catch (error) {
      console.error('PlayFabServer.GetPlayerStatistics', error);
    }

    return value;
  }

  async getLeaderboard(statName: string) {
    console.debug('JovoPlayFab.getLeaderboard');

    const promises = [];

    if (this.config.leaderboard.topMax > 0) {
      const getLeaderboard = promisify(PlayFabServer.GetLeaderboard);
      promises.push(
        getLeaderboard({
          MaxResultsCount: this.config.leaderboard.topMax,
          ProfileConstraints: this.config.leaderboard.profileConstraints,
          StatisticName: statName,
          StartPosition: 0,
        }),
      );
    }

    if (this.config.leaderboard.neighborMax > 0) {
      const getLeaderboardAroundPlayer = promisify(PlayFabServer.GetLeaderboardAroundUser);
      promises.push(
        getLeaderboardAroundPlayer({
          PlayFabId: this.PlayFabId,
          MaxResultsCount: this.config.leaderboard.neighborMax,
          ProfileConstraints: this.config.leaderboard.profileConstraints,
          StatisticName: statName,
        }),
      );
    }

    try {
      const results = await Promise.all(promises);
      let allEntries = [];

      if (results.length === 2) {
        allEntries = [
          ...(results[0].data.Leaderboard ?? []),
          ...(results[1].data.Leaderboard ?? []),
        ];
      } else {
        allEntries = results[0].data.Leaderboard ?? [];
      }

      const mappedEntries = allEntries.map((item) => {
        const currentPlayerPlayFabId = this.jovo.$session.data.playfab.loginInfo.PlayFabId;
        (item as any).IsCurrentPlayer = item.PlayFabId === currentPlayerPlayFabId;
        return item;
      });

      // remove duplicate entries
      const combinedLeaderboard = mappedEntries.filter(
        (item, index) => mappedEntries.findIndex((i) => i.PlayFabId === item.PlayFabId) === index,
      );

      if (this.config.leaderboard.userDataKeys.length > 0) {
        // add user data
        for (const entry of Object.values(combinedLeaderboard)) {
          const userData = await this.getUserData(
            this.config.leaderboard.userDataKeys,
            entry.PlayFabId,
          );
          (entry as any).UserData = userData;
        }
      }

      return combinedLeaderboard;
    } catch (error) {
      console.error('PlayFabServer Leaderboards', error);
    }

    return null;
  }

  async updateUserData(
    data: AnyObject,
    permission: UserDataPermission = UserDataPermission.Public,
  ): Promise<boolean> {
    console.debug('JovoPlayFab.updateUserData');

    const updateUserDataRequest = {
      PlayFabId: this.PlayFabId,
      Data: this.stringifyValues(data),
      Permission: permission,
    };
    const updateUserData = promisify(PlayFabServer.UpdateUserData);

    try {
      const result = await updateUserData(updateUserDataRequest);
      console.debug('PlayFabServer.UpdateUserData', JSON.stringify(result, null, 2));

      return true;
    } catch (error) {
      console.error('PlayFabServer.UpdateUserData', error);
    }

    return false;
  }

  async getUserData(keys: string | string[], playFabId?: string): Promise<AnyObject | null> {
    console.debug('JovoPlayFab.getUserData');

    let value: any | undefined;

    if (!playFabId) {
      playFabId  = this.PlayFabId
    }

    const getUserDataRequest = {
      PlayFabId: playFabId,
      Keys: Array.isArray(keys) ? keys : [keys],
    };

    const getUserData = promisify(PlayFabServer.GetUserData);

    try {
      const result = await getUserData(getUserDataRequest);
      console.debug('PlayFabServer.GetUserData', JSON.stringify(result, null, 2));

      if (result.status === ApiStatus.OK) {
        value = this.parseUserDataRecords(result.data.Data);
      }
    } catch (error) {
      console.error('PlayFabServer.GetUserData', error);
    }

    return value;
  }

  private stringifyValues(data: AnyObject): StringObject {
    const newData: StringObject = {};

    for (const [k, v] of Object.entries(data)) {
      newData[k] = JSON.stringify(v);
    }

    return newData;
  }

  private parseUserDataRecords(data: UserDataRecordObject | undefined): AnyObject {
    const newData: AnyObject = {};

    if (!data) {
      return newData;
    }

    for (const [k, v] of Object.entries(data)) {
      const value = v?.Value ?? '';
      newData[k] = this.isJson(value) ? JSON.parse(value) : value.toString();
    }

    return newData;
  }

  private isJson(value: string): boolean {
    try {
      JSON.parse(value);
    } catch (e) {
      return false;
    }
    return true;
  }
}
