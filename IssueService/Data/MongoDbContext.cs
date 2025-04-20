using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using IssueService.Models;

namespace IssueService.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        _database = client.GetDatabase(configuration["MongoDB:Database"]);
    }

    public IMongoCollection<Issue> Issues => _database.GetCollection<Issue>("Issues");
}
