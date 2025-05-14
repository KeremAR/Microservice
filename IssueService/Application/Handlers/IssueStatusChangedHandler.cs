using MediatR;
using IssueService.Domain.IssueAggregate.Events;
using IssueService.Messaging.Interfaces;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace IssueService.Application.Handlers
{
    public class IssueStatusChangedPayload
    {
        public string IssueId { get; set; }
        public string NewStatus { get; set; }
        // public string UserId { get; set; } // Consider adding UserId if available in the event
        public DateTime Timestamp { get; set; }
    }

    public class IssueStatusChangedHandler : INotificationHandler<IssueStatusChangedEvent>
    {
        private readonly IRabbitMQProducer _rabbitMQProducer;
        // private readonly IHttpContextAccessor _httpContextAccessor; // If you need to access UserId from HttpContext

        public IssueStatusChangedHandler(IRabbitMQProducer rabbitMQProducer /*, IHttpContextAccessor httpContextAccessor*/)
        {
            _rabbitMQProducer = rabbitMQProducer;
            // _httpContextAccessor = httpContextAccessor;
        }

        public Task Handle(IssueStatusChangedEvent notification, CancellationToken cancellationToken)
        {
            Console.WriteLine($"Handling IssueStatusChangedEvent for IssueId: {notification.IssueId}");

            // string userId = _httpContextAccessor?.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "SYSTEM";
            
            var messagePayload = new IssueStatusChangedPayload
            {
                IssueId = notification.IssueId,
                NewStatus = notification.NewStatus,
                // UserId = userId, // Set UserId here if you retrieve it
                Timestamp = DateTime.UtcNow
            };

            try
            {
                _rabbitMQProducer.PublishIssueStatusChanged(messagePayload);
                Console.WriteLine($"Successfully published IssueStatusChangedEvent for IssueId: {notification.IssueId} to RabbitMQ.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error publishing IssueStatusChangedEvent for IssueId: {notification.IssueId} to RabbitMQ. Error: {ex.Message}");
                // Optionally, rethrow or handle more gracefully depending on requirements
            }
            
            return Task.CompletedTask;
        }
    }
} 