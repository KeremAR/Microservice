using System.Threading.Tasks;
using System.Collections.Generic;
using IssueService.Domain.IssueAggregate;

namespace IssueService.Repositories.Interfaces;

public interface IIssueRepository
{
    Task<Issue> GetByIdAsync(string id);
    Task CreateAsync(Issue issue);
    Task UpdateStatusAsync(string id, IssueStatus status);
    Task<IEnumerable<Issue>> GetByUserIdAsync(string userId);
}
