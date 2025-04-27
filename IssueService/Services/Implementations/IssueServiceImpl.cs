using System;
using System.Threading.Tasks;
using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
using IssueService.Repositories.Interfaces;
using IssueService.Services.Interfaces;
using MediatR;

namespace IssueService.Services.Implementations;

public class IssueServiceImpl : IIssueService
{
    private readonly IIssueRepository _repository;
    private readonly IMediator _mediator;

    public IssueServiceImpl(
        IIssueRepository repository,
        IMediator mediator)
    {
        _repository = repository;
        _mediator = mediator;
    }

    public async Task<IssueResponse> ReportIssueAsync(CreateIssueRequest request)
    {
        // 1) Aggregate root'tan yeni issue oluştur
        var issue = new Issue(
            title: request.Title,
            description: request.Description,
            category: request.Category,
            photoUrl: request.PhotoUrl,
            userId: request.UserId,
            departmentId: request.DepartmentId);

        // 2) MongoDB'ye kaydet
        await _repository.CreateAsync(issue);

        // 3) Domain Event'leri yayınla (in-memory)
        await DispatchEventsAsync(issue);

        // 4) Response DTO'su dön
        return new IssueResponse(issue);
    }

    public async Task<IssueResponse> GetIssueByIdAsync(string id)
    {
        var issue = await _repository.GetByIdAsync(id);
        if (issue == null)
            throw new Exception("Issue not found");
            
        return new IssueResponse(issue);
    }

    public async Task UpdateIssueStatusAsync(string id, string status)
    {
        // 1) DB'den aggregate'ı al
        var issue = await _repository.GetByIdAsync(id);

        if (issue == null)
            throw new Exception("Issue not found");

        // 2) Domain method üzerinden güncelleme yap
        if (status == "Resolved")
            issue.Resolve(); // domain event ekler

        // 3) DB'de sadece status'u güncelle
        await _repository.UpdateStatusAsync(id, issue.Status);

        // 4) Domain event varsa yayınla
        await DispatchEventsAsync(issue);
    }

    private async Task DispatchEventsAsync(Issue issue)
    {
        foreach (var @event in issue.Events)
        {
            await _mediator.Publish(@event);
        }

        issue.ClearEvents();
    }
}
