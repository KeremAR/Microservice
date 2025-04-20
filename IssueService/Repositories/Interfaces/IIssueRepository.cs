using IssueService.Models;

namespace IssueService.Repositories.Interfaces;

public interface IIssueRepository
{
    Task<Issue> CreateAsync(Issue issue);
    Task<Issue> GetByIdAsync(string id);
    Task UpdateStatusAsync(string id, string status);
}
