using IssueService.Domain.IssueAggregate;

namespace IssueService.DTOs;

public class IssueResponse
{
    public string Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public string PhotoUrl { get; set; }
    public string UserId { get; set; }
    public int DepartmentId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public IssueResponse(Issue issue)
    {
        Id = issue.Id.ToString();
        Title = issue.Title;
        Description = issue.Description;
        Category = issue.Category;
        PhotoUrl = issue.PhotoUrl;
        UserId = issue.UserId;
        DepartmentId = issue.DepartmentId;
        Latitude = issue.Latitude;
        Longitude = issue.Longitude;
        Status = issue.Status.ToString();
        CreatedAt = issue.CreatedAt;
    }
}
