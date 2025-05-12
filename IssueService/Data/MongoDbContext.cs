using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using IssueService.Domain.IssueAggregate;
using System;

namespace IssueService.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        try
        {
            var connectionString = configuration["MongoDB:ConnectionString"];
            var databaseName = configuration["MongoDB:Database"];
            
            Console.WriteLine($"Initializing MongoDB connection to database: {databaseName}");
            
            var settings = MongoClientSettings.FromConnectionString(connectionString);
            settings.ServerApi = new ServerApi(ServerApiVersion.V1);
            settings.ConnectTimeout = TimeSpan.FromSeconds(30);
            
            var client = new MongoClient(settings);
            _database = client.GetDatabase(databaseName);
            
            Console.WriteLine("MongoDB client initialized successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to initialize MongoDB context: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw; // Rethrow as this is a critical error that should prevent the service from starting
        }
    }

    public IMongoCollection<Issue> Issues => _database.GetCollection<Issue>("issues");
}
