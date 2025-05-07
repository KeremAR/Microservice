using MongoDB.Bson;
using MongoDB.Driver;
using IssueService.Data;
using IssueService.Domain.IssueAggregate;
using IssueService.Repositories.Interfaces;
using System.Collections.Generic;

namespace IssueService.Repositories.Implementations;

public class IssueRepository : IIssueRepository
{
    private readonly MongoDbContext _context;

    public IssueRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(Issue issue)
    {
        await _context.Issues.InsertOneAsync(issue);
    }

    public async Task<Issue?> GetByIdAsync(string id)
    {
        var objectId = ObjectId.Parse(id);
        return await _context.Issues
            .Find(i => i.Id == objectId)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateStatusAsync(string id, IssueStatus status)
    {
        var objectId = ObjectId.Parse(id);
        
        // Fixing the issue by using proper field references for filter and update
        var filter = Builders<Issue>.Filter.Eq("Id", objectId); // field name as string
        var update = Builders<Issue>.Update.Set("Status", status); // field name as string
        
        await _context.Issues.UpdateOneAsync(filter, update);
    }

    public async Task<IEnumerable<Issue>> GetByUserIdAsync(string userId)
    {
        return await _context.Issues
            .Find(i => i.UserId == userId)
            .ToListAsync();
    }
}
