# StutterOn API Documentation

This document provides comprehensive documentation for the StutterOn API, an AI-powered speech therapy platform.

## Table of Contents

- [Authentication](#authentication)
  - [Register](#register)
  - [Login](#login)
  - [Google Authentication](#google-authentication)
- [User Management](#user-management)
  - [Get Current User](#get-current-user)
  - [Update User Profile](#update-user-profile)
  - [Delete User Account](#delete-user-account)
- [Speech Therapy API](#speech-therapy-api)
  - [Start Session](#start-session)
  - [End Session](#end-session)
  - [Get Progress Data](#get-progress-data)
- [GraphQL API](#graphql-api)
  - [Schema](#schema)
  - [Queries](#queries)
    - [me](#me)
    - [sessions](#sessions)
    - [progress](#progress)
  - [Mutations](#mutations)
    - [signup](#signup)
    - [login](#login)
    - [startSession](#startsession)
    - [endSession](#endsession)
  - [Subscriptions](#subscriptions)
    - [progressUpdated](#progressupdated)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

### Register

**Endpoint:** `/api/signup`

**Method:** `POST`

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "[email address removed]",
  "password": "securepassword"
}