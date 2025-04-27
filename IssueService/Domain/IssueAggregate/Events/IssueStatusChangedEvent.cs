using MediatR;

namespace IssueService.Domain.IssueAggregate.Events;

public class IssueStatusChangedEvent : INotification
{
    public string IssueId { get; }
    public string NewStatus { get; }

    public IssueStatusChangedEvent(string issueId, string newStatus)
    {
        IssueId = issueId;
        NewStatus = newStatus;
    }
}
