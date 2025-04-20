using IssueService.Data;
using IssueService.Repositories.Implementations;
using IssueService.Repositories.Interfaces;
using IssueService.Services.Implementations;
using IssueService.Services.Interfaces;
using IssueService.Messaging.Implementations;
using IssueService.Messaging.Interfaces;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

// MongoDB Context
builder.Services.AddSingleton<MongoDbContext>();

// MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Program>());

// Repositories
builder.Services.AddScoped<IIssueRepository, IssueRepository>();

// Services
builder.Services.AddScoped<IIssueService, IssueServiceImpl>();

// RabbitMQ Producer
builder.Services.AddSingleton<IRabbitMQProducer, RabbitMQProducer>();

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

app.Run();
