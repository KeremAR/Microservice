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
            UserId = notification.Issue.UserId,
            CreatedAt = notification.Issue.CreatedAt
        };

        _producer.PublishIssueCreated(message);
        return Task.CompletedTask;
    }
}
