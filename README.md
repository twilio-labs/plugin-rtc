# @twilio-labs/plugin-rtc

[![CircleCI](https://circleci.com/gh/twilio-labs/plugin-rtc/tree/master.svg?style=svg&circle-token=df6c2750596f1000c1cf13e45dc314e00f0a2204)](https://circleci.com/gh/twilio-labs/plugin-rtc/tree/master)

This plugin adds functionality to the [Twilio CLI](https://github.com/twilio/twilio-cli) which supports developing and deploying real-time communication apps.

* [Getting Started](#getting-started)
* [Supported Apps](#supported-apps)
* [Commands](#commands)

# Getting Started

## Install the Twilio CLI

Via `npm` or `yarn`:

```sh-session
$ npm install -g twilio-cli
$ yarn global add twilio-cli
```

Via `homebrew`:

```sh-session
$ brew tap twilio/brew && brew install twilio
```

See the [Twilio CLI documentation](https://www.twilio.com/docs/twilio-cli/quickstart) for more information.

## Install the plugin

```sh-session
$ twilio plugins:install @twilio-labs/plugin-rtc
```

# Supported Apps

This plugin currently supports the following applications:

## Twilio Video App

A mobile and web collaboration application built with Programmable Video. Visit the projects below for instructions on how to use this plugin to build and deploy the Twilio Video app.

  * [React App](https://github.com/twilio/twilio-video-app-react)
  * [iOS App](https://github.com/twilio/twilio-video-app-ios)
  * [Android App](https://github.com/twilio/twilio-video-app-android)

## Token Server API Documentation

The following section documents the application [token server](/src/video-token-server.js) used to provide [Programable Video access tokens](https://www.twilio.com/docs/video/tutorials/user-identity-access-tokens) to supported Twilio Video applications. The token server is deployed as a [Twilio Function](https://www.twilio.com/docs/runtime/functions).

| Method | URL |
| --- | --- |
| POST | [`/token`](#token) |

### Authentication

The application token server requires an [authentication mechanism](twilio-rtcappsvideodeploy---authentication-auth) to be specified when deploying. The following section documents each support authentication mechanism.

#### Passcode

Each request is verified using a passcode generated at deploy time. By default, passcodes remain valid for one week. After the passcode expires, users can redeploy an application and a new passcode will be generated. The snippet below provides an example request body made by a supported application.

```
{
  "passcode": "1234564321",
  "user_identity": "User",
  "room_name": "Demo",
}
```

#### Token

Returns a Programmable Video Access token.

##### URL

`/token`

##### Method

`POST`

##### Body Params

###### Required

   - `passcode=[string]`
   - `user_identity=[string]`
   - `room_name=[string]`

##### Success Response

###### Status

200

###### Body

`0000000000000000.0000000000000000000000.00000000000000000`

##### Error Responses

The following table provides a summary all the possible error responses for this route.

<table>
<tr>
<th>
Status
</th>
<th>
Response
</th>
</tr>

<!-- Rows -->
<tr>
<td>
<pre>
401
</pre>
</td>

<td>
<pre>
{
    "error": {
      "message": "passcode expired",
      "explanation": "The passcode used to validate application users has expired. Re-deploy the application to refresh the passcode."
    }
}
</pre>
</td>
</tr>

<tr>
<td>
<pre>
401
</pre>
</td>

<td>
<pre>
{
    "error": {
      "message": "passcode incorrect",
      "explanation": "The passcode used to validate application users is incorrect."
    }
}
</pre>
</td>
</tr>

</table>

# Commands
  <!-- commands -->
* [`twilio rtc:apps:video:delete`](#twilio-rtcappsvideodelete)
* [`twilio rtc:apps:video:deploy --authentication <auth>`](#twilio-rtcappsvideodeploy---authentication-auth)
* [`twilio rtc:apps:video:view`](#twilio-rtcappsvideoview)

## `twilio rtc:apps:video:delete`

Delete a Programmable Video app

```
USAGE
  $ twilio rtc:apps:video:delete

OPTIONS
  -l=(debug|info|warn|error|none)  [default: info] Level of logging messages.
  -o=(columns|json|tsv)            [default: columns] Format of command output.
  -p, --profile=profile            Shorthand identifier for your profile.

EXAMPLE
  $ twilio rtc:apps:video:delete
  Removed app with Passcode: 1111111111
```

## `twilio rtc:apps:video:deploy --authentication <auth>`

Deploy a Programmable Video app 

```
USAGE
  $ twilio rtc:apps:video:deploy --authentication <auth>

OPTIONS
  -l=(debug|info|warn|error|none)  [default: info] Level of logging messages.
  -o=(columns|json|tsv)            [default: columns] Format of command output.
  -p, --profile=profile            Shorthand identifier for your profile.
  --app-directory=app-directory    Name of app directory to use
  --authentication=(passcode)      (required) Type of authentication to use
  --override                       Override an existing App deployment

DESCRIPTION
  This command publishes two components as a Twilio Function: an application token
  server and an optional React application.

  Token Server
  The token server provides Programmable Video access tokens and authorizes
  requests with the specified authentication mechanism.

  React Application
  The commands includes support for publishing a Programmable Video React
  Application. For more details using this plugin with the Programmable Video
  React application, please visit the project's home page.
  https://github.com/twilio/twilio-video-app-react

EXAMPLES
  # Deploy an application token server with passcode authentication
  $ twilio rtc:apps:video:deploy --authentication passcode
  deploying app... done
  Passcode: 1111111111

  # Deploy an application token server with the React app
  $ twilio rtc:apps:video:deploy --authentication passcode --app-directory /path/to/app
  deploying app... done
  Web App URL: https://video-app-1111-dev.twil.io?passcode=1111111111
  Passcode: 1111111111

  # Override an existing app with a fresh deployment
  # Please note that this will remove a previously deployed web application if no
  # app directory is provided
  $ twilio rtc:apps:video:deploy --authentication passcode --override 
  Removed app with Passcode: 1111111111
  deploying app... done
  Passcode: 2222222222
  Expires: Mon Mar 09 2020 16:36:23 GMT-0600
```

## `twilio rtc:apps:video:view`

View a Programmable Video app

```
USAGE
  $ twilio rtc:apps:video:view

OPTIONS
  -l=(debug|info|warn|error|none)  [default: info] Level of logging messages.
  -o=(columns|json|tsv)            [default: columns] Format of command output.
  -p, --profile=profile            Shorthand identifier for your profile.

EXAMPLE
  $ twilio rtc:apps:video:view
  Web App URL: https://video-app-1111-dev.twil.io?passcode=1111111111
  Passcode: 1111111111
```
<!-- commandsstop -->
