using IssueService.DTOs;

namespace IssueService.Services.Interfaces;

public interface IIssueService
{
    Task<IssueResponse> ReportIssueAsync(CreateIssueRequest request);
    Task<IssueResponse> GetIssueByIdAsync(string id);
    Task UpdateIssueStatusAsync(string id, string status);
}
