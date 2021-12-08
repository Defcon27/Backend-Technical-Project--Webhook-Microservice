# Technical-Project-Backend---Webhook-Microservice

This repository contains the code for Webhook microservice that demostates my work on Backend Technologies. It is a webhook microservice where the admin can CREATE, READ, UPDATE, DELETE webhooks. This service also has a trigger functionality which send an `IPAddress` and `UNIX Timestamp` to the targets.
<br><br>



## POSTMAN Documentation
[![DOCS](https://img.shields.io/badge/Documentation-see%20docs-orange?style=for-the-badge&logo=postman)](https://documenter.getpostman.com/view/15724687/TzmCgYUu) 



<!-- ## Hosted Link <a href="https://webhook-service.herokuapp.com/">Here</a> -->


## API Reference

#### Register Webhook

```http
  POST /register
```

| Parameter | Type     | Description                                 |
| :-------- | :------- | :------------------------------------------ |
| `Target URL` | `string` | **Required**. Target URL to be registered|
###### Example Response
```json
{
  "success": true,
  "targetURL_ID": "60f2db558fd18e0015277155"
}
```
<br>



#### Update Webhook

```http
  PUT /update
```

| Parameter     | Type     | Description                                 |
| :--------     | :------- | :------------------------------------------ |
| `id`          | `string` | **Required**. ID of TargetURL to be updated |
| `newTargetURL`| `string` | **Required**. Updated TargetURL |
###### Example Response
```json
{
  "success": true
}
```
<br>




#### Get list of Webhooks

```http
  GET /list
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| -         |        - |                           -|
###### Example Response
```json
[
  {
    "_id": "60f2db558fd18e0015277155",
    "targetURL": "https://new.updated.webhook.com"
  },
  {
    "_id": "60f2ddaa8fd18e001527715a",
    "targetURL": "https://webhook.site/1437e51f-3ee6-4ea9-a929-8ba02a490545"
  }
]
```
<br>





#### Delete Webhook

```http
  DEL /delete
```

| Parameter     | Type     | Description                                 |
| :--------     | :------- | :-----------------------------------------  |
| `id`          | `string` | **Required**. ID of TargetURL to be updated |
###### Example Response
```json
{
  "success": true
}
```
<br>




#### Trigger Webhooks

```http
  GET /
```

| Query Parameter| Type     | Description                                          |
| :--------     | :------- | :-----------------------------------------           |
| `ipAddress`   | `string` | **Required**. IP Address to be POSTED to Target URLS |
###### Example Response
```json
[
  {
    "targetURL": "https://webhook.site/1437e51f-3ee6-4ea9-a929-8ba02a490545",
    "Response": 200
  },
  {
    "targetURL": "https://webhook.site/d93d4b57-03d7-4f92-b925-faeec815f018",
    "Response": 408
  },
  {
    "targetURL": "https://webhook.site/deadlink",
    "Response": 404
  }
]
```
<br>

###### Example Data Received on Target
```json
{
  "ipAddress": "192.168.0.1",
  "timestamp": 1626529781325
}
```


<br>
<br>





## Installation
 - Clone the repository using `git clone https://github.com/Defcon27/Technical-Project-Backend---Webhook-Microservice.git`
 - Install dependencies using `npm install`
 - Create .env file and add `MONGODB_URL=mongodb+srv://....Your MongoDB Databse URL`
 - Start server using `npm start`
 - Server starts running at `http://localhost:3000` in local environment

