using System.Threading.Tasks;
using IssueService.Domain.IssueAggregate;

namespace IssueService.Repositories.Interfaces;

public interface IIssueRepository
{
    Task<Issue> GetByIdAsync(string id);
    Task CreateAsync(Issue issue);
    Task UpdateStatusAsync(string id, IssueStatus status);
}
