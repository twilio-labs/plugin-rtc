# Changelog

## 0.8.2

### Maintenence

- The [recording rules function](https://github.com/twilio-labs/plugin-rtc/blob/master/src/serverless/functions/recordingrules.js) now uses the Twilio client returned by `context.getTwilioClient()`.

## 0.8.1

### Enhancement

- Specified a timer when creating a Twilio Conversation. This will automatically close the conversation after 24 hours, which is equal to the maximum duration of a video room. This helps to clean up old conversations since there is a limit that a single participant can not be added to more than 1,000 open conversations.

## 0.8.0

### New Features

- Added support for Twilio Conversations. When an application requests a token from the `/token` endpoint, a `create_conversation=true` parameter can now be specified. When this parameter is present, the `/token` endpoint will create a conversation that is associated with the room and add the participant to it. This allows video application to use [Twilio Conversations](https://www.twilio.com/conversations-api) for in-room chat.

### Maintenence

- Upgraded @twilio/cli-core from 5.15.1 to 5.17.0
- Upgraded lodash from 4.17.20 to 4.17.21

## 0.7.1

### Maintenence

- This version upgrades dependencies in order to resolve this [security advisory](https://github.com/advisories/GHSA-4w2v-q235-vp99) regarding the axios library.
- Upgraded @twilio/cli-core from 5.9.3 to 5.15.1
- Upgraded twilio from 3.48.2 to 3.54.2

## 0.7.0

### Enhancements

- This version adds a new endpoint which allows users to update the recording rules for a given room. See the [README](README.md#recording-rules) for more details.
- Upgraded @twilio/cli-core from 5.9.1 to 5.9.3
- Upgraded moment from 2.28.0 to 2.29.0
- Upgraded nanoid from 3.1.13 to 3.1.16
- Upgraded @twilio-labs/serverless-api from 4.0.2 to 4.0.3

## 0.6.0

### Enhancements

- This version will print a URL to the terminal where the user can view and edit the deployed token server function in the Twilio console. By default, the token server is editable in the Twilio console, but this can be disabled with the `--no-ui-editable` flag.
- Upgraded @twilio/cli-core from 5.9.0 to 5.9.1
- Upgraded moment from 2.27.0 to 2.28.0
- Upgraded @twilio-labs/serverless-api from 4.0.1 to 4.0.2

## 0.5.0

### Enhancements

- Updated the `--room-type` flag to add new 'go' room type.

## 0.4.0

### Maintenence

- Updated the logic in the video token server so that it always returns the `room_type` parameter.
- Upgraded @twilio/cli-core from 5.8.1 to 5.9.0

## 0.3.0

### Enhancements

- This version adds the ability to specify the room type when deploying a video application token server. Use the `--room-type` flag when deploying the app. For example: `twilio rtc:apps:video:deploy --authentication passcode --room-type group-small`. The payload returned by the token server will also include the room type (see the [readme](README.md) for details). The `--room-type` flag is optional and the default value is `group`.

## 0.2.0

### Breaking Change

- This version adds extra random digits to the URL used by the Twilio Video Apps. The format of the URL has changed from `https://video-app-xxxx-dev.twil.io` to `https://video-app-xxxx-yyyy-dev.twil.io`. The [iOS Video App](https://github.com/twilio/twilio-video-app-ios) and [Android Video App](https://github.com/twilio/twilio-video-app-android) must be upgraded in order to work with this new format. The [React Video App](https://github.com/twilio/twilio-video-app-react) does not need to be upgraded. This change is being made to increase the number of available domains (from ten thousand to ten million) which will greatly reduce the number of 409 (conflict) errors experienced by users.

## 0.1.6

### Maintenance

- Move @oclif/plugin-help from devDependencies to dependencies to resolve NPM warning.

## 0.1.5

### Maintenance

- Updated `twilio rtc:apps:video:deploy` command so that it checks for the existence of a necessary Twilio API Key before deploying the video token server.

## 0.1.4

### Maintenance

- Updated `twilio rtc:apps:video:delete` command so that it doesn't check for serverless environments before deleting the app. This allows the command to delete the app even when no environments exist.

## 0.1.3

### Features

- Updated the `twilio rtc:apps:video:deploy --override` flag behavior to update an existing Twilio Serverless instance rather than deleting and redeploying an instance. This behavior allows users to update an existing deployment's passcode without changing their application's URL. This betterment was proposed in #14.

### Maintenance

- Use the Twilio Account SID from a Twilio Function context rather than copying from a Twilio Client instance.

## 0.1.2

### Maintenance

- Addressed security alerts

## 0.1.1

### Maintenance

- Updated the token server to return the following error response with status code `400` when the request body is missing the `user_identity` field.

```json
{
  "error": {
    "message": "missing user_identity",
    "explanation": "The user_identity parameter is missing."
  }
}
```

## 0.1.0

The Twilio RTC plugin is a [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) plugin created to help developers develop and deploy real-time communication applications. To get started using this plugin, please reference the supported [apps section](https://github.com/twilio-labs/plugin-rtc/tree/v0.1.0#supported-apps).
