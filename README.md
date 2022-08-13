# Jovo Community Plugin - PlayFab

<img src="playfab.png" width="100" height="100">

## Overview

This plugin for the [Jovo Framework](https://github.com/jovotech/jovo-framework) allows you to use the featurs of the [PlayFab](https://docs.microsoft.com/en-us/gaming/playfab/what-is-playfab) LiveOps game backend including anonymous login, player profiles, game statistics, user data and leaderboards.

This PlayFab plugin uses the classic APIs and not the newer Entity Programming Model.

## Supports

- Jovo Framework 4.x
- Platforms: any (alexa, googleAssistant, core, web, etc.)

## RIDR Lifecycle

This plugin is registered as part of the `dialogue.start` [middleware](https://www.jovo.tech/docs/middlewares#ridr-middlewares) and is meant to be used in component handlers and hooks after that point.


## Install

Install the plugin into your Jovo project:

`npm install @jovo-community/plugin-playfab --save`

Register the plugin in:

app.js:

```javascript
const { PlayFabPlugin } = require('@jovo-community/plugin-playfab');

const app = new App({
  plugins: [
    new PlayFabPlugin({/*...*/}),
  ],
});
```

app.ts:

```typescript
import { PlayFabPlugin } from '@jovo-community/plugin-playfab';

const app = new App({
  plugins: [
    new PlayFabPlugin({/*...*/}),   
  ],
});
```

## Configuration

The plugin has the following values:

```typescript
new PlayFabPlugin({
  titleId: '',
  developerSecretKey: '',
  login: {
    autoLogin: true,
    extendedProfileKey: '',
    maxNewProfileRetries: 2,
    onNewProfile: (jovo: Jovo) => { return {/*...*/}},
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
}),
```

Here is a typical configuration:

```typescript
{
  titleId: 'A999',
  login : {
    extendedProfileKey: 'extendedProfile',
    maxNewProfileRetries: 2,
    infoRequestParameters: {
      GetPlayerProfile: true,
      ProfileConstraints: {
        ShowDisplayName: true,
        ShowAvatarUrl: true,
      },
      GetPlayerStatistics: true,
      PlayerStatisticNames: ['score'],
      GetUserData: true,
      UserDataKeys: ['extendedProfile'],
    }, 
    onNewProfile: (jovo: Jovo) => { return { displayName: 'player1' }},  
  },
  leaderboard: {
    topMax: 5,
    neighborMax: 2,
    userDataKeys: ['extendedProfile'],
    profileConstraints: {
      ShowDisplayName: true,
      ShowAvatarUrl: true,
    }
  }
}
```

- `titleId`: The PlayFab game title id.
- `login`: Configuration values for login. See [login](#login) for more information.
- `leaderboard`: Configuration values for the leaderboard. See [leaderboard](#leaderboard) for more information.
- `developerSecretKey`: Developer key needed to use the PlayFabServer API. See [Server API](#server-api) for more information.

### login

Settings used when `this.$playfab.login()` is called. Login is called once per session.

The login configuration includes:

- `autoLogin`: Automatically calls `$playfab.login()` each new session. Default value is `true`.
- `infoRequestParameters`: The PlayFab player combined info request parameters. For more information, see [GetPlayerCombinedInfoRequestParams](https://docs.microsoft.com/en-us/rest/api/playfab/client/authentication/login-with-custom-id?view=playfab-rest#getplayercombinedinforequestparams) in the PlayFab documentation.
- `onNewProfile`: A callback that is called after a new player is created in PlayFab to provide a profile. For more information, see [$playfab.login](#playfablogin).
- `extendedProfileKey`: If provided, the key in player user data to use for extended profile information. Default value is '' meaning there is no extended profile info. For more information, see [$playfab.updateProfile](#playfabupdateprofile).
- `maxNewProfileRetries`: The number of times to call PlayFab with a new player's profile values (before continuing) when the call fails. A number between 0-10. Default value is 2. Use with caution. For more information, see [$playfab.updateProfile](#playfabupdateprofile).


### leaderboard

Settings used when `this.$playfab.getLeaderboard()` is called. For more information, see [$playfab.getLeaderboard](#playfabgetleaderboard).

The leaderboard configuration includes:

- `topMax`: The number of players to return from the top of the leaderboard. Number between 0-100. Default value is 5. 
- `neighborMax`: The number of players (including the current player) to return immediately surrounding the current player. Number between 0-100. Default value is 2.
- `profileConstraints`: The profile values to return for each player in the leaderboard. For more information, see [PlayerProfileViewConstraints](https://docs.microsoft.com/en-us/rest/api/playfab/client/player-data-management/get-leaderboard?view=playfab-rest#playerprofileviewconstraints) in the PlayFab documentation.
- `userDataKeys`: An array of strings with each public player user data key that you want to return for each player in the leaderboard. This can be used to return extended profile information to use on the leaderboard. 

Voice-only applications should keep this values for `topMax` and `neighborMax` to 5 or less. This value can be heigher when displaying the leaderboard. The total number of players in the returned leaderboard is the sum of `topMax` and `neighborMax` after duplicate entries are removed.

Caution: When `userDataKeys` is set, an API call is made for each player in the leaderboard to get the user data. Don't use when there are lots of players in the returned leaderboard.


## Usage

Access functions and properties of this plugin using `this.$playfab`.

### Functions

The following functions are available:

- `login()`: Logs the player into PlayFab creating a new account if the player doesn't exist. See [$playfab.login](#playfablogin)
- `updateProfile()`: Updates the player's profile which includes display name and avatar URL. See [$playfab.updateProfile](#playfabupdateprofile)
- `updateStat()`: Updates the player's statistics. See [$playfab.updateStat](#playfabupdatestat)
- `getStat()`: Get statistics for a player. See [$playfab.getStat](#playfabgetstat)
- `getLeaderboard()`: Gets the leaderboard for a statistic. See [$playfab.getLeaderboard](#playfabgetleaderboard)
- `updateUserData()`: Updates the player's user data. See [$playfab.updateUserData](#playfabupdateuserdata)
- `getUserData()`: Get the current player's or another player's public user data. See [$playfab.getUserData](#playfabgetuserdata)

Behind the scenes, these functions call the PlayFab Client REST API.

The profile is in the format:

### $playfab.login

Once (on the first request of a new session), `$playfab.login()` is automatically called when `autoLogin` is `true` (default). Otherwise `$playfab.login()` must be called manually. The is no return value. Check `this.$session.data.playfab.loginStatus` for status.

```typescript
await this.$playfab.login();
```

First, `PlayFabClient.LoginWithCustomID` is called using Jovo `$user.id` as the CustomId. If this is the first login for the CustomId then a new player is created in PlayFab. Otherwise, the existing player is logged in. On success, the Jovo session values of `playfab.loginInfo` and `playfab.sessionTicket` are set. 

#### New User

For a new user, a new player profile (with display name) is created only when the `login.onNewProfile` callback is set. Return a `ProfileInfo` object for the callback:

```typescript
interface ProfileInfo {
  displayName?: string;
  avatarUrl?: string;
  extendedProfile?: AnyObject;
}
```

Here is an example of `onNewProfile` using the [Player Generator Plugin](https://www.jovo.tech/marketplace/plugin-playergenerator):

```typescript
async function onNewProfile(jovo: Jovo) {
  console.log('PlayFabPlugin:onNewProfile');

  const profile = jovo.$playergen.generateProfile();

  const playFabProfile = {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    extendedProfile: {
      color: profile.color,
      locale: jovo.$request.getLocale(),
    },
  } as ProfileInfo;

  return playFabProfile;
}
```

Once the profile is generated, [$playfab.updateProfile()](#playfabupdateprofile) is called. Depending on your settings in PlayFab and the uniqueness of the displayName, the call to `updateProfile()` might fail. The plugin will try a total of `login.maxNewProfileRetries` times each time calling `onNewProfile` to get a different displayName (and other profile values). If none of those display name are accepted by PlayFab, the login process will continue and the user will not have a profile. You can call `updateProfile()` manually after that if needed.



The Jovo session value `playfab.isDisplayNameUpdated` will be set to `true` if the display name was set in PlayFab and `false` if it wasn't.

#### Existing User

If the login was for an existing user, the profile data is set on the Jovo session data key `playfab.profile`. It is important to set the `login.infoRequestParameters` values for `GetPlayerProfile` and `ProfileConstraints` as this is how the profile values are returned for PlayFab:

```typescript
{
  login: {
    infoRequestParameters: {
      GetPlayerProfile: true,
      ProfileConstraints: {
        ShowDisplayName: true,
        ShowAvatarUrl: true,
      },
      //...
    },
    //...
  },
  //...
}
```

If there is a value set for `login.extendedProfileKey` in config, then the extended profile data is retrieved from the player's user data. The easiest way to do this is to set the `login.infoRequestParameters` values for `GetUserData` and `UserDataKeys`. The value for `UserDataKeys` should include an entry matching the value for `login.extendedProfileKey`:

```typescript
{
  login: {
    extendedProfileKey: 'extendedProfile',
    infoRequestParameters: {
      GetUserData: true,
      UserDataKeys: ['extendedProfile'],
      //...
    },
    //...
  },
  //...
}
```

If `login.extendedProfileKey` is set but `login.infoRequestParameters` is not set to return the extended profile data, a separate call to [$playfab.getUserData](#playfabgetuserdata) will be made.

#### Login Status

At the end of the login process, the Jovo session value of `playfab.loginStatus` will be set to 'newUser', 'existingUser', or 'error'.

#### Session Data

Sample session data for a new player:

```typescript
{
  "playfab": {
    "profile": {
      "displayName": "Blue-eyed Albatross 7769",
      "avatarUrl": "https://example.com/avatar4.png",
      "extendedProfile": {
        "color": "#3a2af7",
        "locale": "en"
      }
    },
    "sessionTicket": "6DDA124D5...-AAA...",
    "loginStatus": "newUser",
    "isDisplayNameUpdated": true,
    "loginInfo": {
      "SessionTicket": "6DDA124D5...-AAA...",
      "PlayFabId": "6DDA124D...",
      "NewlyCreated": true,
      "SettingsForUser": {
        "NeedsAttribution": false,
        "GatherDeviceInfo": true,
        "GatherFocusInfo": true
      },
      "InfoResultPayload": {
        "UserInventory": [],
        "UserData": {},
        "UserDataVersion": 0,
        "UserReadOnlyDataVersion": 0,
        "CharacterInventories": [],
        "PlayerStatistics": []
      },
      "EntityToken": {
        "EntityToken": "NHxZM0N...",
        "TokenExpiration": "2022-08-14T16:32:50.729Z",
        "Entity": {
          "Id": "BA1D4E2...",
          "Type": "title_player_account",
          "TypeString": "title_player_account"
        }
      },
      "TreatmentAssignment": {
        "Variants": [],
        "Variables": []
      }
    }
  }
}
```

Sample session data for an existing player:

```typescript
{
  "playfab": {
    "profile": {
      "displayName": "Blue-eyed Albatross 7769",
      "avatarUrl": "https://example.com/avatar4.png",
      "extendedProfile": {
        "color": "#3a2af7",
        "locale": "en"
      }
    },
    "sessionTicket": "6DDA124D5...-AAA...",
    "loginStatus": "existingUser",
    "loginInfo": {
      "SessionTicket": "6DDA124D5...-AAA...",
      "PlayFabId": "6DDA124D...",
      "NewlyCreated": false,
      "SettingsForUser": {
        "NeedsAttribution": false,
        "GatherDeviceInfo": true,
        "GatherFocusInfo": true
      },
      "LastLoginTime": "2022-08-13T16:32:50.729Z",
      "InfoResultPayload": {
        "UserInventory": [],
        "UserData": {
          "extendedProfile": {
            "Value": "{\"color\":\"#3a2af7\",\"locale\":\"en\"}",
            "LastUpdated": "2022-08-13T16:32:51.644Z",
            "Permission": "Public"
          }
        },
        "UserDataVersion": 1,
        "UserReadOnlyDataVersion": 0,
        "CharacterInventories": [],
        "PlayerStatistics": [],
        "PlayerProfile": {
          "PublisherId": "F54412...",
          "TitleId": "B729",
          "PlayerId": "6DDA124D...",
          "DisplayName": "Blue-eyed Albatross 7769",
          "AvatarUrl": "https://example.com/avatar4.png"
        }
      },
      "EntityToken": {
        "EntityToken": "NHxZM0N...",
        "TokenExpiration": "2022-08-14T16:43:26.323Z",
        "Entity": {
          "Id": "BA1D4E2...",
          "Type": "title_player_account",
          "TypeString": "title_player_account"
        }
      },
      "TreatmentAssignment": {
        "Variants": [],
        "Variables": []
      }
    }
  }
}
```

The value of `playfab.loginInfo` is a snapshot of the values at login time. They are most useful when processing the first request in a session. The Jovo session data `playfab.loginInfo.PlayFabId` value is useful in many PlayFab API calls.

Use the profile info in code: `this.$session.data.playfab.profile`.


### $playfab.updateProfile

Call `updateProfile()` to create a profile if setting the profile failed during `login()` (check `this.$session.data.playfab.isDisplayNameUpdated`) or update the existig profile. Returns `true` if the profile was updated. Otherwise, `false`. Since each property on a profile is a separate call to PlayFab, there may be a situation where one fails and another succeeds. If only one succeeds, the return value is `true`.

```typescript
await this.$playfab.updateProfile({ displayName: 'my name' });
```

The profile has these values:

```typescript
interface ProfileInfo {
  displayName?: string;
  avatarUrl?: string;
  extendedProfile?: AnyObject;
}
```

- `displayName`: Optional. The player's display name. For PlayFab the max length is 25 characters.
- `avatarUrl`: Optional. The URL of the player's avatar.
- `extendedProfile`: Optional. A single object with string keys and `any` value. This value is stored in PlayFab user data only when the `login.extendedProfileKey` config entry has a value.

You can set displayName, avatarUrl and extendedProfile combined or separately. The extendedProfile value is all set together.

### $playfab.updateStat

Statistics in PlayFab have a string key and a number value (ex: `score: 10`). Call `updateStat()` to update a statistic:

```typescript
await this.$playfab.updateStat('score', 10);
```


### $playfab.getStat

Statistics in PlayFab have a string key and a number value (ex: `score: 10`). Call `getStat()` to get a statistic:

```typescript
const score = await this.$playfab.getStat('score');
```

### $playfab.getLeaderboard

A leaderboard in PlayFab is related to a statistic and can have a frequency of hourly, daily, weekly, monthly or manually. PlayFab automatically handles creating a new board and keeping a history.

See [leaderboard](#leaderboard) for configuration settings.

Call `getLeaderboard()` to get the active (current version) leaderboard:

```typescript
const leaderboard = await this.$playfab.getLeaderboard('score');
```

The result has the following structure:

```typescript
{
    DisplayName?: string;
    PlayFabId?: string;
    Position: number;
    Profile?: PlayerProfileModel;
    StatValue: number;
    IsCurrentPlayer: boolean;
    UserData?: any
}
```

The values `Position`, `StatValue` and `IsCurrentPlayer` are the only values that will always be set. Other values are determined by configuration settings and if the players have the values set in PlayFab.


Here is a sample result:

```typescript
[
  {
    "PlayFabId": "28309...",
    "DisplayName": "Defiant Gerbil 0210",
    "StatValue": 100,
    "Position": 0,
    "Profile": {
      "PublisherId": "F5441...",
      "TitleId": "A999",
      "PlayerId": "28309...",
      "DisplayName": "Defiant Gerbil 0210"
    },
    "IsCurrentPlayer": false,
    "UserData": {}
  },
  //...
  {
    "PlayFabId": "6DDA124D...",
    "DisplayName": "Blue-eyed Albatross 7769",
    "StatValue": 0,
    "Position": 6,
    "Profile": {
      "PublisherId": "F5441...",
      "TitleId": "A999",
      "PlayerId": "6DDA124D...",
      "DisplayName": "Blue-eyed Albatross 7769",
      "AvatarUrl": "https://example.com/avatar4.png"
    },
    "IsCurrentPlayer": true,
    "UserData": {
      "extendedProfile": {
        "color": "#3a2af7",
        "locale": "en"
      }
    }
  }
]
```

### $playfab.updateUserData

Call `updateUserData()` to set user data for the current player. Pass the `data` and an optional `permission` (default: `Public`). Returns `true` if the data was updates. Otherwise, `false`.

```typescript
const result = await this.$playfab.updateUserData({ mykey: 'my value' });
```

The `data` is a single object with string keys and `any` values. Since PlayFab stores all user data values as strings, each property value is passed to `JSON.stringify()` before the API is called. Doing this makes the call easier to use and allows for objects and arrays as property values. 

NOTE: There are limits for user data values. Refer to Title Settings > Limits in Game Manager (the PlayFab developer portal).


### $playfab.getUserData

Call `getUserData()` to get public user data for the current player or another player. Returns an object with user data properties or null;

Pass a string or string[] to `keys` for the user data values you want returned. When `playFabId` is not passed, values for the current user are returned. You will not normally need to set `playFabId`, but `getLeaderboard()` uses it when returning extended profile user data.

```typescript
const result = await this.$playfab.getUserData({ keys: 'extendedProfile' });
```

Since PlayFab stores all user data values as strings, this function attempts to convert each property value back to a string, number, boolean, object or array. 

NOTE: There are limits for user data values. Refer to Title Settings > Limits in Game Manager (the PlayFab developer portal).

### Client API

The functions on `this.$playfab` wrap one or more calls to the Client API and groups them together in a simplified, useful way.

To access all the functionality of the Client API, call `this.$playfab.PlayFabClient` followed by the request you want to make. For more information, see [PlayFab Client REST API](https://docs.microsoft.com/en-us/rest/api/playfab/client/?view=playfab-rest) in the documentation.

To turn the callback function into a promise, use `promisify`.

Here is an example:

```typescript
import { promisify } from 'util';

const updatePlayerStatistics = promisify(this.$playfab.PlayFabClient.UpdatePlayerStatistics)
const result = await updatePlayerStatistics({/*...*/});
```

To use the Client API, you must set the value of `titleId` in the plugin config. When `titleId` has a value, `PlayFab.settings.titleId` is set when the plugin loads.

### Server API

To access all the functionality of the Server API, call `this.$playfab.PlayFabServer` followed by the request you want to make. For more information, see [PlayFab Server REST API](https://docs.microsoft.com/en-us/rest/api/playfab/server/?view=playfab-rest) in the documentation.

To turn the callback function into a promise, use `promisify`.

Here is an example:

```typescript
import { promisify } from 'util';

const getUserData = promisify(this.$playfab.PlayFabServer.GetUserData)
const result = await getUserData({/*...*/});
```

To use the Server API, you must set the value of `developerSecretKey` in the plugin config. When `developerSecretKey` has a value, `PlayFab.settings.developerSecretKey` is set when the plugin loads.


## Jovo Debugger
If using the Jovo Debugger, you must add `$playfab` to the list of properties the debugger ignores:

```ts
// app.dev.ts

new JovoDebugger({
  ignoredProperties: ['$app', '$handleRequest', '$platform', '$playfab'],
}),
```

## Jovo Game Starter project

To get started with PlayFab in Jovo, check out the [jovo-game-starter](https://github.com/jovo-community/jovo-game-starter) project.

## Video

- [Configure a New Game Title in PlayFab Game Manager](https://youtu.be/pYnTjraEZAo) (4:46)


# License

MIT