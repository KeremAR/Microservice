using IssueService.DTOs;
using IssueService.Models;
using IssueService.Repositories.Interfaces;
using IssueService.Services.Interfaces;

namespace IssueService.Services.Implementations;

public class IssueServiceImpl : IIssueService
{
    private readonly IIssueRepository _repository;
    private readonly RabbitMQProducer _rabbitMQProducer;

    public IssueServiceImpl(IIssueRepository repository, RabbitMQProducer rabbitMQProducer)
    {
        _repository = repository;
        _rabbitMQProducer = rabbitMQProducer;
    }

    public async Task<IssueResponse> ReportIssueAsync(CreateIssueRequest request)
    {
        var issue = new Issue
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            PhotoUrl = request.PhotoUrl,
            UserId = request.UserId
        };

        var createdIssue = await _repository.CreateAsync(issue);

        // RabbitMQ event mesajını yayınla:
        var eventMessage = new 
        { 
            Event = "IssueCreated", 
            IssueId = createdIssue.Id, 
            CreatedAt = createdIssue.CreatedAt,
            UserId = createdIssue.UserId,
            Title = createdIssue.Title
        };
        
        _rabbitMQProducer.PublishIssueCreated(eventMessage);

        return new IssueResponse(createdIssue);
    }

    public async Task<IssueResponse> GetIssueByIdAsync(string id)
    {
        var issue = await _repository.GetByIdAsync(id);
        return new IssueResponse(issue);
    }

    public async Task UpdateIssueStatusAsync(string id, string status)
    {
        await _repository.UpdateStatusAsync(id, status);
    }
}
