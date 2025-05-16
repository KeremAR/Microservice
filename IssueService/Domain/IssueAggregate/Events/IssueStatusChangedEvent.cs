using MediatR;

namespace IssueService.Domain.IssueAggregate.Events;

public class IssueStatusChangedEvent : INotification
{
    public string IssueId { get; }
    public string NewStatus { get; }
    public string UserId { get; }
    public string Title { get; }

    public IssueStatusChangedEvent(string issueId, string newStatus, string userId, string title)
    {
        IssueId = issueId;
        NewStatus = newStatus;
        UserId = userId;
        Title = title;
    }
}
