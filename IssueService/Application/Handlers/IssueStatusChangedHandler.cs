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
        public string UserId { get; set; }
        public string Title { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class IssueStatusChangedHandler : INotificationHandler<IssueStatusChangedEvent>
    {
        private readonly IRabbitMQProducer _rabbitMQProducer;

        public IssueStatusChangedHandler(IRabbitMQProducer rabbitMQProducer)
        {
            _rabbitMQProducer = rabbitMQProducer;
        }

        public Task Handle(IssueStatusChangedEvent notification, CancellationToken cancellationToken)
        {
            Console.WriteLine($"Handling IssueStatusChangedEvent for IssueId: {notification.IssueId}");
            Console.WriteLine($"Event details - NewStatus: {notification.NewStatus}, UserId: {notification.UserId}, Title: {notification.Title}");

            var messagePayload = new IssueStatusChangedPayload
            {
                IssueId = notification.IssueId,
                NewStatus = notification.NewStatus,
                UserId = notification.UserId,
                Title = notification.Title,
                Timestamp = DateTime.UtcNow
            };

            try
            {
                Console.WriteLine("Publishing message to RabbitMQ...");
                _rabbitMQProducer.PublishIssueStatusChanged(messagePayload);
                Console.WriteLine($"Successfully published IssueStatusChangedEvent for IssueId: {notification.IssueId} to RabbitMQ.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error publishing IssueStatusChangedEvent for IssueId: {notification.IssueId} to RabbitMQ. Error: {ex.Message}");
                throw;
            }
            
            return Task.CompletedTask;
        }
    }
} 