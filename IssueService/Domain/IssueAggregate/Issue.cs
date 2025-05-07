using IssueService.Domain.Common;
using IssueService.Domain.IssueAggregate.Events;

namespace IssueService.Domain.IssueAggregate;

public class Issue : BaseEntity
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public string Category { get; private set; }
    public string PhotoUrl { get; private set; }
    public string UserId { get; private set; }
    public int DepartmentId { get; private set; }
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public IssueStatus Status { get; private set; } = IssueStatus.Pending;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Issue() { } // Mongo için boş ctor

    public Issue(string title, string description, string category, string photoUrl, string userId, int departmentId, double latitude, double longitude)
    {
        Title = title;
        Description = description;
        Category = category;
        PhotoUrl = photoUrl;
        UserId = userId;
        DepartmentId = departmentId;
        Latitude = latitude;
        Longitude = longitude;

        AddEvent(new IssueCreatedEvent(this));
    }

    public void Resolve()
    {
        if (Status == IssueStatus.Resolved) return;
        Status = IssueStatus.Resolved;
        AddEvent(new IssueStatusChangedEvent(Id.ToString(), Status.ToString()));
    }
}
