using MediatR;
using IssueService.Domain.IssueAggregate.Events;
using IssueService.Messaging.Interfaces;

namespace IssueService.Application.Handlers;

public class IssueCreatedHandler : INotificationHandler<IssueCreatedEvent>
{
    private readonly IRabbitMQProducer _producer;

    public IssueCreatedHandler(IRabbitMQProducer producer)
    {
        _producer = producer;
    }

    public Task Handle(IssueCreatedEvent notification, CancellationToken cancellationToken)
    {
        var message = new
        {
            Id = notification.Issue.Id.ToString(),
            Title = notification.Issue.Title,
            Description = notification.Issue.Description,
            Category = notification.Issue.Category,
            PhotoUrl = notification.Issue.PhotoUrl,
            UserId = notification.Issue.UserId,
            DepartmentId = notification.Issue.DepartmentId,
            Latitude = notification.Issue.Latitude,
            Longitude = notification.Issue.Longitude,
            Status = notification.Issue.Status.ToString(),
            CreatedAt = notification.Issue.CreatedAt
        };

        _producer.PublishIssueCreated(message);
        return Task.CompletedTask;
    }
}
