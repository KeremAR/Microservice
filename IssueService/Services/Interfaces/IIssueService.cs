using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
using System.Collections.Generic;

namespace IssueService.Services.Interfaces;

public interface IIssueService
{
    Task<IssueResponse> ReportIssueAsync(CreateIssueRequest request);
    Task<IssueResponse> GetIssueByIdAsync(string id);
    Task UpdateIssueStatusAsync(string id, IssueStatus status);
    Task<IEnumerable<IssueResponse>> GetIssuesByUserIdAsync(string userId);
    Task<IEnumerable<IssueResponse>> GetAllIssuesAsync();
}
