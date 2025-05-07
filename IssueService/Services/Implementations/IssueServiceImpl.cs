using System;
using System.Threading.Tasks;
using IssueService.DTOs;
using IssueService.Domain.IssueAggregate;
using IssueService.Repositories.Interfaces;
using IssueService.Services.Interfaces;
using MediatR;
using System.Threading;
using System.Collections.Generic;
using System.Linq;

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

    public async Task<Issue> ReportIssueAsync(CreateIssueRequest request)
    {
        // 1) Aggregate root'tan yeni issue oluştur
        var issue = new Issue(
            title: request.Title,
            description: request.Description,
            category: request.Category,
            photoUrl: request.PhotoUrl,
            userId: request.UserId,
            departmentId: request.DepartmentId,
            latitude: request.Latitude,
            longitude: request.Longitude);

        // 2) MongoDB'ye kaydet
        await _repository.CreateAsync(issue);

        // 3) Domain Event'leri yayınla (in-memory)
        await DispatchEventsAsync(issue);

        // 4) Response DTO'su dön
        return issue;
    }

    public async Task<Issue> GetIssueByIdAsync(string id)
    {
        var issue = await _repository.GetByIdAsync(id);
        if (issue == null)
            throw new KeyNotFoundException("Issue not found");
            
        return issue;
    }

    public async Task UpdateIssueStatusAsync(string id, IssueStatus status)
    {
        // 1) DB'den aggregate'ı al
        var issue = await _repository.GetByIdAsync(id);

        if (issue == null)
            throw new KeyNotFoundException("Issue not found");

        // 2) Domain method üzerinden güncelleme yap
        if (status == IssueStatus.Resolved)
            issue.Resolve(); // domain event ekler

        // 3) DB'de sadece status'u güncelle
        await _repository.UpdateStatusAsync(id, status);

        // 4) Domain event varsa yayınla
        await DispatchEventsAsync(issue);
    }

    public async Task<IEnumerable<Issue>> GetIssuesByUserIdAsync(string userId)
    {
        var issues = await _repository.GetByUserIdAsync(userId);
        return issues;
    }

    public async Task<IEnumerable<Issue>> GetAllIssuesAsync()
    {
        var issues = await _repository.GetAllAsync();
        return issues;
    }

    public async Task<IEnumerable<Issue>> GetIssuesByDepartmentIdAsync(int departmentId)
    {
        var issues = await _repository.GetByDepartmentIdAsync(departmentId);
        return issues;
    }

    private async Task DispatchEventsAsync(Issue issue)
    {
        foreach (var @event in issue.Events)
        {
            await _mediator.Publish(@event, CancellationToken.None);
        }

        issue.ClearEvents();
    }
}
