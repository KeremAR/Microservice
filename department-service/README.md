## Department Service

This service manages operations related to different departments within the campus. It provides the following RESTful API endpoints for managing department information and performing department-based queries. Additionally, it uses domain events and the RabbitMQ message queue system for asynchronous communication with other microservices.

### RESTful API Endpoints

The Department Service can be accessed via the following endpoints:

* **`GET /departments`**: Retrieves a list of all departments.

    * **HTTP Method:** `GET`
    * **Response:** Returns a JSON array containing department objects.

* **`GET /departments/{id}`**: Retrieves the details of a specific department based on its ID.

    * **HTTP Method:** `GET`
    * **Path Parameter:** `{id}`: The unique ID of the requested department.
    * **Response:** Returns a JSON object containing the department details. If the department is not found, it returns a `404 Not Found` error.

* **`POST /departments`**: Creates a new department.

    * **HTTP Method:** `POST`
    * **Request Body:** Contains the information for the department to be created in JSON format.
    * **Response:** Returns a JSON object containing the details of the created department, typically with a `201 Created` status code.

* **`GET /departments/{id}/issues`**: Retrieves the issues (problems) associated with a specific department ID. This endpoint communicates with the Issue Service to fetch the issue information related to the department.

    * **HTTP Method:** `GET`
    * **Path Parameter:** `{id}`: The unique ID of the requested department.
    * **Response:** Returns a JSON array containing issue objects related to the department. If the department is not found, it may return a `404 Not Found` error.

### Domain Events and RabbitMQ Integration

This service listens for the following domain events and performs specific actions in response:

* **`Issue Created`:** Published by the Issue Service when a new issue (problem, request, etc.) is created. Upon receiving this event, the Department Service may save the new issue information to its local database or perform association operations with the relevant department.

    * **Queue:** `issue_created`
    * **Exchange (Assumption):** Currently, the service is directly listening to the queue. If an exchange is used, the relevant exchange name and routing key information will be added here.

### RabbitMQ Configuration

The service uses the following configuration settings to communicate with RabbitMQ (specified in the application.properties or application.yml file):

* **`spring.rabbitmq.host`:** The address of the RabbitMQ server (e.g., `localhost`).
* **`spring.rabbitmq.port`:** The port of the RabbitMQ server (default: `5672`).
* **`spring.rabbitmq.username`:** The username used for the RabbitMQ connection (e.g., `guest`).
* **`spring.rabbitmq.password`:** The password used for the RabbitMQ connection (e.g., `guest`).

### Processing the "Issue Created" Event

When the "Issue Created" event is received, the service performs the following steps:

1.  The event message is retrieved from the `issue_created` queue via RabbitMQ.
2.  The received message (assumed to be in JSON format) is parsed, and the relevant issue information is extracted.
3.  Using this information, corresponding records are created or updated in the Department Service's local database, if necessary.
4.  Notifications may be sent to relevant departments (a feature to be added in the future).

### Development Notes

* Detailed information about the format (JSON schema) of the "Issue Created" event can currently be found in the Issue Service documentation.
* The event processing logic (within the `IssueCreatedListener` class) should be developed to include database operations and other necessary steps based on the incoming message.
* Error handling and retry mechanisms should be implemented to address potential issues during RabbitMQ connection and event processing.
* Details on how the `/departments/{id}/issues` endpoint communicates with the Issue Service and which endpoint it uses will be clarified following discussions with the Issue Service team.