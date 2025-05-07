# API Gateway for Microservices

This API Gateway routes requests to the various microservices in the Campus Caution application.

## Environment Configuration

The gateway uses environment files stored in the `config` directory:

- `config/development.env`: Used for local development
- `config/docker.env`: Used when running in Docker

## Running the Gateway

### Development Mode

```bash
npm run dev
```

This will use the `development.env` file with localhost URLs.

### Docker Mode

```bash
npm run docker
```

Or use the docker-compose file from the parent directory:

```bash
docker-compose up
```

## Environment Variables

The following environment variables can be configured:

- `PORT`: The port the gateway listens on (default: 3000)
- `USER_SERVICE_URL`: URL for the user service
- `DEPARTMENT_SERVICE_URL`: URL for the department service
- `ISSUE_SERVICE_URL`: URL for the issue service
- `NOTIFICATION_SERVICE_URL`: URL for the notification service

## Mobile App Configuration

The mobile app uses different API base URLs depending on the environment:
- Development: http://192.168.1.105:3000
- Test: http://test-api.campuscaution.com
- Production: https://api.campuscaution.com 