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

    public async Task<IEnumerable<Issue>> GetAllAsync()
    {
        return await _context.Issues
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<IEnumerable<Issue>> GetByDepartmentIdAsync(int departmentId)
    {
        return await _context.Issues
            .Find(i => i.DepartmentId == departmentId)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(string id)
    {
        Console.WriteLine($"Repository.DeleteAsync çağrıldı, ID: {id}");
        try
        {
            var objectId = ObjectId.Parse(id);
            Console.WriteLine($"MongoDB ObjectID oluşturuldu: {objectId}");
            
            var filter = Builders<Issue>.Filter.Eq("Id", objectId);
            Console.WriteLine($"Filter oluşturuldu");
            
            var result = await _context.Issues.DeleteOneAsync(filter);
            Console.WriteLine($"DeleteOne sonucu: DeletedCount={result.DeletedCount}, IsAcknowledged={result.IsAcknowledged}");
            
            return result.DeletedCount > 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Repository.DeleteAsync'de hata: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw; // Rethrow the exception
        }
    }
}
