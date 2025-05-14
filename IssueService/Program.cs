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
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// MongoDB Context
builder.Services.AddSingleton<MongoDbContext>();

// MediatR
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});

// Repositories
builder.Services.AddScoped<IIssueRepository, IssueRepository>();

// Services
builder.Services.AddScoped<IIssueService, IssueServiceImpl>();

// RabbitMQ Producer
builder.Services.AddSingleton<IRabbitMQProducer, RabbitMQProducer>();

// Prometheus Metrics
// Define and register the counter for created issues
var issuesCreatedCounter = Metrics.CreateCounter(
    "issues_created_total", 
    "Total number of issues created."
);
builder.Services.AddSingleton(issuesCreatedCounter); // Register the counter instance

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

// Enable Prometheus metrics
app.UseMetricServer();
app.UseHttpMetrics();

// Explicitly map the metrics endpoint if UseMetricServer doesn't suffice
app.MapMetrics();

//app.UseHttpsRedirection();
app.UseCors("AllowAll");
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
