using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;

namespace IssueService.Services.Interfaces;

public interface IIssueService
{
    Task<IssueResponse> ReportIssueAsync(CreateIssueRequest request);
    Task<IssueResponse> GetIssueByIdAsync(string id);
    Task UpdateIssueStatusAsync(string id, IssueStatus status);
}
