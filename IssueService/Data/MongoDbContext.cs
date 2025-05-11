using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using IssueService.Domain.IssueAggregate; 


namespace IssueService.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDB:ConnectionString"];
        var settings = MongoClientSettings.FromConnectionString(connectionString);
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        var client = new MongoClient(settings);
        _database = client.GetDatabase(configuration["MongoDB:Database"]);
    }

   public IMongoCollection<Issue> Issues =>  _database.GetCollection<Issue>("issues");
}
