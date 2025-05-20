using IssueService.Data;
using IssueService.Repositories.Implementations;
using IssueService.Repositories.Interfaces;
using IssueService.Services.Implementations;
using IssueService.Services.Interfaces;
using IssueService.Messaging.Implementations;
using IssueService.Messaging.Interfaces;
using MediatR;
using MongoDB.Driver;
using MongoDB.Bson;
using Prometheus;
using StackExchange.Redis;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// MongoDB Context
builder.Services.AddSingleton<MongoDbContext>();

// MediatR
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});

// Redis Cache
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? builder.Configuration["Redis:ConnectionString"];
if (string.IsNullOrEmpty(redisConnectionString)) 
{
    // Fallback if not found in ConnectionStrings or Redis:ConnectionString
    // This attempts to build it from REDIS_HOST and REDIS_PORT environment variables if they exist
    var redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? "localhost"; // Default to localhost if no env var
    var redisPort = Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379";    // Default to 6379 if no env var
    redisConnectionString = $"{redisHost}:{redisPort}";
    Console.WriteLine($"Redis connection string not found in configuration, attempting to use: {redisConnectionString} from environment variables or defaults.");
}
else
{
    Console.WriteLine($"Using Redis connection string from configuration: {redisConnectionString}");
}

builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
{
    try
    {
        Console.WriteLine($"Attempting to connect to Redis with connection string: {redisConnectionString}");
        var configurationOptions = ConfigurationOptions.Parse(redisConnectionString);
        // You can configure more options here if needed, e.g.:
        // configurationOptions.AbortOnConnectFail = false; // Important for startup resilience
        // configurationOptions.ConnectTimeout = 5000; // 5 seconds
        // configurationOptions.SyncTimeout = 5000;
        var multiplexer = ConnectionMultiplexer.Connect(configurationOptions);
        Console.WriteLine("Successfully connected to Redis.");
        return multiplexer;
    }
    catch (RedisConnectionException ex)
    {
        Console.Error.WriteLine($"FATAL: Could not connect to Redis. Connection string: {redisConnectionString}. Error: {ex.Message}");
        // Depending on your resilience requirements, you might want to:
        // 1. Throw the exception to prevent the app from starting if Redis is critical.
        // 2. Return a null or a mock/dummy implementation if Redis is optional and the app can run without it.
        // For now, we rethrow to make it clear that Redis connection failed.
        throw;
    }
});

// Repositories
builder.Services.AddScoped<IIssueRepository, IssueRepository>();

// Prometheus Metrics - Define counters before they are used in IssueServiceImpl
var issuesCreatedCounter = Metrics.CreateCounter(
    "issues_created_total", 
    "Total number of issues created."
);
var issuesDeletedCounter = Metrics.CreateCounter(
    "issues_deleted_total",
    "Total number of issues deleted."
);
var issuesUpdatedCounter = Metrics.CreateCounter(
    "issues_updated_total",
    "Total number of issues updated."
);
// Register the counter instances with DI (as singleton)
builder.Services.AddSingleton(issuesCreatedCounter); 
builder.Services.AddSingleton(issuesDeletedCounter);
builder.Services.AddSingleton(issuesUpdatedCounter);

// Services
builder.Services.AddScoped<IIssueService>(sp => new IssueServiceImpl(
    sp.GetRequiredService<IIssueRepository>(),
    sp.GetRequiredService<IMediator>(),
    issuesCreatedCounter, // Now using the defined counter instance
    issuesDeletedCounter, // Now using the defined counter instance
    issuesUpdatedCounter, // Now using the defined counter instance
    sp.GetRequiredService<IConnectionMultiplexer>()
));

// RabbitMQ Producer
builder.Services.AddSingleton<IRabbitMQProducer, RabbitMQProducer>();

// CORS policy ekle
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Issue Service API",
        Version = "v1",
        Description = "API for managing campus caution issues"
    });
});

var app = builder.Build();

// Always enable Swagger in any environment for debugging
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Issue Service API v1");
    c.RoutePrefix = string.Empty; // Set Swagger UI at the root
});

app.UseRouting();

// Enable Prometheus metrics
app.UseHttpMetrics();
app.UseMetricServer("/metrics");

//app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Authentication and Authorization should typically be between UseRouting and UseEndpoints/MapControllers
// app.UseAuthentication(); // Uncomment if you have authentication
app.UseAuthorization();

app.MapControllers();

// Ping MongoDB Atlas on startup for connectivity check
try
{
    Console.WriteLine($"Attempting to connect to MongoDB with connection string: {builder.Configuration["MongoDB:ConnectionString"]}");
    Console.WriteLine($"Using database: {builder.Configuration["MongoDB:Database"]}");
    
    var mongoSettings = MongoClientSettings.FromConnectionString(builder.Configuration["MongoDB:ConnectionString"]);
    mongoSettings.ServerApi = new ServerApi(ServerApiVersion.V1);
    mongoSettings.ConnectTimeout = TimeSpan.FromSeconds(30);
    
    var mongoClient = new MongoClient(mongoSettings);
    var pingResult = mongoClient.GetDatabase(builder.Configuration["MongoDB:Database"])
        .RunCommand<BsonDocument>(new BsonDocument("ping", 1));
    Console.WriteLine($"✨ MongoDB ping succeeded: {pingResult}");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ MongoDB connection failed: {ex.Message}");
    Console.WriteLine($"Exception type: {ex.GetType().Name}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    // Continue execution even if MongoDB is not available
}

// Add RabbitMQ connection check
try {
    string hostname = builder.Configuration["RabbitMQ:HostName"] ?? "localhost";
    int port = int.Parse(builder.Configuration["RabbitMQ:Port"] ?? "5672");
    string username = builder.Configuration["RabbitMQ:UserName"] ?? "guest";
    string password = builder.Configuration["RabbitMQ:Password"] ?? "guest";
    
    Console.WriteLine($"⏳ Checking RabbitMQ connection ({hostname}:{port})...");
    
    var factory = new RabbitMQ.Client.ConnectionFactory() {
        HostName = hostname,
        Port = port,
        UserName = username,
        Password = password
    };
    
    using var connection = factory.CreateConnection();
    Console.WriteLine("✨ RabbitMQ connection successful");
} catch (Exception ex) {
    Console.WriteLine($"❌ RabbitMQ connection failed: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    // Don't throw the exception, so the application can still start even if RabbitMQ is unavailable
}

// Force RabbitMQProducer initialization to ensure queue is created at startup
try 
{
    Console.WriteLine("🔄 Initializing RabbitMQProducer to create queue...");
    var rabbitProducer = app.Services.GetRequiredService<IRabbitMQProducer>();
    Console.WriteLine("✨ RabbitMQProducer initialized!");
    
    // Optional: Send a test message
    /*
    var testMessage = new { Message = "Test message at startup" };
    rabbitProducer.PublishIssueCreated(testMessage);
    Console.WriteLine("✨ Test message published to queue");
    */
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error initializing RabbitMQProducer: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
}

app.Run();
