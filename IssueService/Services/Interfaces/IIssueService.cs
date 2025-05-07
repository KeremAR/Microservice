using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
using System.Collections.Generic;

namespace IssueService.Services.Interfaces;

public interface IIssueService
{
    Task<Issue> ReportIssueAsync(CreateIssueRequest request);
    Task<Issue> GetIssueByIdAsync(string id);
    Task<IEnumerable<Issue>> GetIssuesByUserIdAsync(string userId);
    Task<IEnumerable<Issue>> GetAllIssuesAsync();
    Task UpdateIssueStatusAsync(string id, IssueStatus status);
    Task<IEnumerable<Issue>> GetIssuesByDepartmentIdAsync(int departmentId);
}
