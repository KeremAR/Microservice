using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;

namespace IssueService.Services.Implementations;

public class RabbitMQProducer : IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel      _channel;
    private readonly string      _queueName;

    public RabbitMQProducer(IConfiguration configuration)
    {
        var factory = new ConnectionFactory
        {
            HostName = configuration["RabbitMQ:HostName"],
            Port     = int.Parse(configuration["RabbitMQ:Port"] ?? "5672"),
            UserName = configuration["RabbitMQ:UserName"],
            Password = configuration["RabbitMQ:Password"]
        };

        _connection = factory.CreateConnection();     // ✅ parametresiz artık var
        _channel    = _connection.CreateModel();      // ✅ IModel
        _queueName  = configuration["RabbitMQ:QueueName"] ?? "issue_created";

        _channel.QueueDeclare(
            queue       : _queueName,
            durable     : true,
            exclusive   : false,
            autoDelete  : false,
            arguments   : null);
    }

    public void PublishIssueCreated(object message)
    {
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));

        _channel.BasicPublish(
            exchange       : "",
            routingKey     : _queueName,
            basicProperties: null,
            body           : body);
    }

    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
