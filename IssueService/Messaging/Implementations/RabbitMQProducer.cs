using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using IssueService.Messaging.Interfaces;
using System.Threading;

namespace IssueService.Messaging.Implementations;

public class RabbitMQProducer : IRabbitMQProducer, IDisposable
{
    private IConnection _connection;
    private IModel _channel;
    private readonly string _queueName;
    private readonly IConfiguration _configuration;
    private readonly int _maxRetries = 5;
    private readonly int _retryDelayMs = 2000; // 2 seconds

    public RabbitMQProducer(IConfiguration configuration)
    {
        _configuration = configuration;
        _queueName = configuration["RabbitMQ:QueueName"] ?? "issue_created";
        
        // Try to connect to RabbitMQ with retries
        ConnectToRabbitMQ();
    }

    private void ConnectToRabbitMQ()
    {
        int retryCount = 0;
        bool connected = false;

        while (!connected && retryCount < _maxRetries)
        {
            try
            {
                Console.WriteLine($"Attempt {retryCount + 1} to connect to RabbitMQ...");
                
                var factory = new ConnectionFactory
                {
                    HostName = _configuration["RabbitMQ:HostName"],
                    Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
                    UserName = _configuration["RabbitMQ:UserName"],
                    Password = _configuration["RabbitMQ:Password"]
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                // Declare the queue
                _channel.QueueDeclare(
                    queue: _queueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                Console.WriteLine($"✨ Successfully connected to RabbitMQ and declared queue: {_queueName}");
                connected = true;
            }
            catch (Exception ex)
            {
                retryCount++;
                Console.WriteLine($"❌ Failed to connect to RabbitMQ (attempt {retryCount}/{_maxRetries}): {ex.Message}");
                
                if (retryCount < _maxRetries)
                {
                    Console.WriteLine($"Retrying in {_retryDelayMs}ms...");
                    Thread.Sleep(_retryDelayMs);
                }
                else
                {
                    Console.WriteLine("Maximum retry attempts reached. Failed to connect to RabbitMQ.");
                    // Still create the connection objects as null so the service can start
                    // but operations will fail until RabbitMQ is available
                }
            }
        }
    }

    public void PublishIssueCreated(object message)
    {
        try
        {
            // Check if we need to reconnect
            if (_channel == null || _connection == null || !_connection.IsOpen)
            {
                Console.WriteLine("RabbitMQ connection is not available. Attempting to reconnect...");
                ConnectToRabbitMQ();
                
                // If we still couldn't connect, log and return
                if (_channel == null || _connection == null || !_connection.IsOpen)
                {
                    Console.WriteLine("❌ Cannot publish message - RabbitMQ connection is not available");
                    return;
                }
            }

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            Console.WriteLine($"[RabbitMQProducer] Publishing JSON: {json}");

            _channel.BasicPublish(
                exchange: "",
                routingKey: _queueName,
                basicProperties: null,
                body: body);

            Console.WriteLine($"✨ Message published to queue {_queueName} successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error publishing message to RabbitMQ: {ex.Message}");
        }
    }

    public void Dispose()
    {
        try
        {
            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during RabbitMQ disposal: {ex.Message}");
        }
    }
} 