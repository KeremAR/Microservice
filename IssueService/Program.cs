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

var builder = WebApplication.CreateBuilder(args);

// MongoDB Context
builder.Services.AddSingleton<MongoDbContext>();

// MediatR
builder.Services.AddMediatR(typeof(Program));

// Repositories
builder.Services.AddScoped<IIssueRepository, IssueRepository>();

// Services
builder.Services.AddScoped<IIssueService, IssueServiceImpl>();

// RabbitMQ Producer
builder.Services.AddSingleton<IssueService.Messaging.Interfaces.IRabbitMQProducer, IssueService.Messaging.Implementations.RabbitMQProducer>();

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Ping MongoDB Atlas on startup for connectivity check
var mongoSettings = MongoClientSettings.FromConnectionString(builder.Configuration["MongoDB:ConnectionString"]);
mongoSettings.ServerApi = new ServerApi(ServerApiVersion.V1);
var mongoClient = new MongoClient(mongoSettings);
try
{
    var pingResult = mongoClient.GetDatabase(builder.Configuration["MongoDB:Database"])
        .RunCommand<BsonDocument>(new BsonDocument("ping", 1));
    Console.WriteLine($"✨ MongoDB ping succeeded: {pingResult}");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ MongoDB ping failed: {ex.Message}");
}

app.Run();
