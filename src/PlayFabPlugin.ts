import {
  Extensible,
  PluginConfig,
  Plugin,
  HandleRequest,
  InvalidParentError,
  JovoError,
  Jovo,
} from '@jovotech/framework';

import { JovoPlayFab } from './JovoPlayFab';

export interface PlayerProfileViewConstraints {
  // Whether to show player's avatar URL. Defaults to false
  ShowAvatarUrl: boolean;
  // Whether to show the banned until time. Defaults to false
  ShowBannedUntil: boolean;
  // Whether to show campaign attributions. Defaults to false
  ShowCampaignAttributions: boolean;
  // Whether to show contact email addresses. Defaults to false
  ShowContactEmailAddresses: boolean;
  // Whether to show the created date. Defaults to false
  ShowCreated: boolean;
  // Whether to show the display name. Defaults to false
  ShowDisplayName: boolean;
  // Whether to show player's experiment variants. Defaults to false
  ShowExperimentVariants: boolean;
  // Whether to show the last login time. Defaults to false
  ShowLastLogin: boolean;
  // Whether to show the linked accounts. Defaults to false
  ShowLinkedAccounts: boolean;
  // Whether to show player's locations. Defaults to false
  ShowLocations: boolean;
  // Whether to show player's membership information. Defaults to false
  ShowMemberships: boolean;
  // Whether to show origination. Defaults to false
  ShowOrigination: boolean;
  // Whether to show push notification registrations. Defaults to false
  ShowPushNotificationRegistrations: boolean;
  // Reserved for future development
  ShowStatistics: boolean;
  // Whether to show tags. Defaults to false
  ShowTags: boolean;
  // Whether to show the total value to date in usd. Defaults to false
  ShowTotalValueToDateInUsd: boolean;
  // Whether to show the values to date. Defaults to false
  ShowValuesToDate: boolean;
}

export interface GetPlayerCombinedInfoRequestParams {
  // Whether to get character inventories. Defaults to false.
  GetCharacterInventories: boolean;
  // Whether to get the list of characters. Defaults to false.
  GetCharacterList: boolean;
  // Whether to get player profile. Defaults to false. Has no effect for a new player.
  GetPlayerProfile: boolean;
  // Whether to get player statistics. Defaults to false.
  GetPlayerStatistics: boolean;
  // Whether to get title data. Defaults to false.
  GetTitleData: boolean;
  // Whether to get the player's account Info. Defaults to false
  GetUserAccountInfo: boolean;
  // Whether to get the player's custom data. Defaults to false
  GetUserData: boolean;
  // Whether to get the player's inventory. Defaults to false
  GetUserInventory: boolean;
  // Whether to get the player's read only data. Defaults to false
  GetUserReadOnlyData: boolean;
  // Whether to get the player's virtual currency balances. Defaults to false
  GetUserVirtualCurrency: boolean;
  // Specific statistics to retrieve. Leave null to get all keys. Has no effect if GetPlayerStatistics is false
  PlayerStatisticNames?: string[];
  // Specifies the properties to return from the player profile. Defaults to returning the player's display name.
  ProfileConstraints?: PlayerProfileViewConstraints;
  // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetTitleData is false
  TitleDataKeys?: string[];
  // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetUserData is false
  UserDataKeys?: string[];
  // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetUserReadOnlyData is
  // false
  UserReadOnlyDataKeys?: string[];
}

export interface ProfileInfo {
  displayName?: string;
  avatarUrl?: string;
  extendedProfile?: unknown;
}

export interface PlayFabPluginConfig extends PluginConfig {
  titleId: string;
  login: {
    autoLogin: boolean;
    infoRequestParameters: GetPlayerCombinedInfoRequestParams;
    onNewProfile?: (jovo: Jovo) => ProfileInfo | Promise<ProfileInfo>;
    maxNewProfileRetries: number;
    extendedProfileKey: string;
  };
  leaderboard: {
    topMax: number;
    neighborMax: number;
    profileConstraints: PlayerProfileViewConstraints;
    userDataKeys: string[];
  };
  developerSecretKey?: string;
}

export class PlayFabPlugin extends Plugin<PlayFabPluginConfig> {
  mount(parent: Extensible): Promise<void> | void {
    if (!(parent instanceof HandleRequest)) {
      throw new InvalidParentError(this.constructor.name, HandleRequest);
    }

    parent.middlewareCollection.use('dialogue.start', async (jovo) => {
      jovo.$playfab = new JovoPlayFab(this.config, jovo);

      if (!this.config.titleId) {
        throw new JovoError({
          message: `Can not send request to PlayFab. Title-ID is missing.`,
        });
      }

      if (!jovo.$user.id) {
        throw new JovoError({
          message: `Can not send request to PlayFab. User-ID is missing.`,
        });
      }

      if (
        this.config.login.maxNewProfileRetries < 0 ||
        this.config.login.maxNewProfileRetries > 10
      ) {
        throw new JovoError({
          message: `The value for login.maxNewProfileRetries must be between 0-10. Each retry is an API call.`,
        });
      }

      if (
        this.config.leaderboard.topMax < 0 ||
        this.config.leaderboard.topMax > 100
      ) {
        throw new JovoError({
          message: `The value for leaderboard.topMax must be between 0-100.`,
        });
      }

      if (
        this.config.leaderboard.neighborMax < 0 ||
        this.config.leaderboard.neighborMax > 100
      ) {
        throw new JovoError({
          message: `The value for leaderboard.neighborMax must be between 0-100.`,
        });
      }


      jovo.$playfab.init();

      if (this.config.login.autoLogin) {
        await jovo.$playfab.login();
      }
      
    });
  }

  getDefaultConfig(): PlayFabPluginConfig {
    return {
      titleId: '',
      login: {
        autoLogin: true,
        extendedProfileKey: '',
        maxNewProfileRetries: 2,
        infoRequestParameters: {
          GetCharacterInventories: false,
          GetCharacterList: false,
          GetPlayerProfile: false,
          GetPlayerStatistics: false,
          GetTitleData: false,
          GetUserAccountInfo: false,
          GetUserData: false,
          GetUserInventory: false,
          GetUserReadOnlyData: false,
          GetUserVirtualCurrency: false,
        },
      },
      leaderboard: {
        topMax: 5,
        neighborMax: 2,
        userDataKeys: [],
        profileConstraints: {
          ShowAvatarUrl: false,
          ShowBannedUntil: false,
          ShowCampaignAttributions: false,
          ShowContactEmailAddresses: false,
          ShowCreated: false,
          ShowDisplayName: false,
          ShowExperimentVariants: false,
          ShowLastLogin: false,
          ShowLinkedAccounts: false,
          ShowLocations: false,
          ShowMemberships: false,
          ShowOrigination: false,
          ShowPushNotificationRegistrations: false,
          ShowStatistics: false,
          ShowTags: false,
          ShowTotalValueToDateInUsd: false,
          ShowValuesToDate: false,
        },
      },
    };
  }
}
