using IssueService.Data;
using IssueService.Models;
using IssueService.Repositories.Interfaces;
using MongoDB.Driver;

namespace IssueService.Repositories.Implementations;

public class IssueRepository : IIssueRepository
{
    private readonly MongoDbContext _context;

    public IssueRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<Issue> CreateAsync(Issue issue)
    {
        await _context.Issues.InsertOneAsync(issue);
        return issue;
    }

    public async Task<Issue> GetByIdAsync(string id)
    {
        return await _context.Issues.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    public async Task UpdateStatusAsync(string id, string status)
    {
        var filter = Builders<Issue>.Filter.Eq(i => i.Id, id);
        var update = Builders<Issue>.Update.Set(i => i.Status, status);
        await _context.Issues.UpdateOneAsync(filter, update);
    }
}
