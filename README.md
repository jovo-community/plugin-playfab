# Jovo Community Plugin - PlayFab

<img src="playfab.png" width="100" height="100">

## Overview

This plugin for the [Jovo Framework](https://github.com/jovotech/jovo-framework) allows you to use the featurs of the [PlayFab](https://docs.microsoft.com/en-us/gaming/playfab/what-is-playfab) LiveOps game backend including anonymous login, player profiles, game statistics, user data and leaderboards.

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
    onNewProfile,  
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

### login

The login configuration includes:



### leaderboard

The leaderboard configuration includes:



## Usage

Access features of this plugin using `this.$playfab`.

The following functions are available:

- `login()`: xxx.
- `updateProfile()`: xxx.
- `updateStat()`: xxx.
- `getStat()`: xxx.
- `getLeaderboard()`: xxx.
- `updateUserData()`: xxx.
- `getUserData()`: xxx.

The profile is in the format:

```typescript
{
  "displayName": "Weary Crocodile 05877";
  "avatarUrl": "https://example.com/images/avatar1.png";
  "color": "#ff02de";
}
```

## Jovo Debugger
If using the Jovo Debugger, you must add `$playfab` to the list of properties the debugger ignores:

```ts
// app.dev.ts

new JovoDebugger({
  ignoredProperties: ['$app', '$handleRequest', '$platform', '$playfab'],
}),
```

# License

MIT