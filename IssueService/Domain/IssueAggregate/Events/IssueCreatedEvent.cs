using MediatR;
using IssueService.Domain.IssueAggregate;

namespace IssueService.Domain.IssueAggregate.Events;

public class IssueCreatedEvent : INotification
{
    public Issue Issue { get; }

    public IssueCreatedEvent(Issue issue)
    {
        Issue = issue;
    }
}
