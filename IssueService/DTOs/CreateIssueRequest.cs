namespace IssueService.DTOs;

public class CreateIssueRequest
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public string PhotoUrl { get; set; }
    public string UserId { get; set; }
    public int DepartmentId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
