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
using Prometheus;
using StackExchange.Redis;
using System.Text.Json;
using System.Diagnostics;

namespace IssueService.Services.Implementations;

public class IssueServiceImpl : IIssueService
{
    private readonly IIssueRepository _repository;
    private readonly IMediator _mediator;
    private readonly Counter _issuesCreatedCounter;
    private readonly Counter _issuesDeletedCounter;
    private readonly Counter _issuesUpdatedCounter;
    private readonly IDatabase _redisDb;
    private readonly TimeSpan _defaultCacheExpiry = TimeSpan.FromMinutes(1);

    private const string CacheKeyPrefixIssuesAll = "issues_all";

    public IssueServiceImpl(
        IIssueRepository repository,
        IMediator mediator,
        Counter issuesCreatedCounter,
        Counter issuesDeletedCounter,
        Counter issuesUpdatedCounter,
        IConnectionMultiplexer redisConnection)
    {
        _repository = repository;
        _mediator = mediator;
        _issuesCreatedCounter = issuesCreatedCounter;
        _issuesDeletedCounter = issuesDeletedCounter;
        _issuesUpdatedCounter = issuesUpdatedCounter;
        _redisDb = redisConnection.GetDatabase();
    }

    public async Task<Issue> ReportIssueAsync(CreateIssueRequest request)
    {
        var issue = new Issue(
            title: request.Title,
            description: request.Description,
            category: request.Category,
            photoUrl: request.PhotoUrl,
            userId: request.UserId,
            departmentId: request.DepartmentId,
            latitude: request.Latitude,
            longitude: request.Longitude);

        await _repository.CreateAsync(issue);
        _issuesCreatedCounter.Inc();

        var sw = Stopwatch.StartNew();
        await _redisDb.KeyDeleteAsync(CacheKeyPrefixIssuesAll);
        sw.Stop();
        Console.WriteLine($"Cache invalidated after creating issue: {issue.Id}. Key: {CacheKeyPrefixIssuesAll} (took {sw.ElapsedMilliseconds}ms)");

        await DispatchEventsAsync(issue);
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
        var issue = await _repository.GetByIdAsync(id);
        if (issue == null)
            throw new KeyNotFoundException("Issue not found");

        if (status == IssueStatus.Resolved)
            issue.Resolve();

        await _repository.UpdateStatusAsync(id, status);
        _issuesUpdatedCounter.Inc();

        var sw = Stopwatch.StartNew();
        await _redisDb.KeyDeleteAsync(CacheKeyPrefixIssuesAll);
        sw.Stop();
        Console.WriteLine($"Cache invalidated after updating issue: {id}. Key: {CacheKeyPrefixIssuesAll} (took {sw.ElapsedMilliseconds}ms)");

        await DispatchEventsAsync(issue);
    }

    public async Task<IEnumerable<Issue>> GetIssuesByUserIdAsync(string userId)
    {
        var issues = await _repository.GetByUserIdAsync(userId);
        return issues;
    }

    public async Task<IEnumerable<Issue>> GetAllIssuesAsync()
    {
        string cacheKey = CacheKeyPrefixIssuesAll;
        
        var cacheReadSw = Stopwatch.StartNew();
        var cachedIssues = await _redisDb.StringGetAsync(cacheKey);
        cacheReadSw.Stop();

        if (cachedIssues.HasValue)
        {
            Console.WriteLine($"Cache HIT for key: {cacheKey} (took {cacheReadSw.ElapsedMilliseconds}ms)");
            var deserializeSw = Stopwatch.StartNew();
            var result = JsonSerializer.Deserialize<List<Issue>>(cachedIssues, GetJsonSerializerOptions());
            deserializeSw.Stop();
            Console.WriteLine($"Deserialization took {deserializeSw.ElapsedMilliseconds}ms");
            return result;
        }

        Console.WriteLine($"Cache MISS for key: {cacheKey} (lookup took {cacheReadSw.ElapsedMilliseconds}ms)");
        
        var dbSw = Stopwatch.StartNew();
        var issues = await _repository.GetAllAsync();
        dbSw.Stop();
        Console.WriteLine($"Database fetch took {dbSw.ElapsedMilliseconds}ms");
        
        var serializeSw = Stopwatch.StartNew();
        var serializedIssues = JsonSerializer.Serialize(issues, GetJsonSerializerOptions());
        serializeSw.Stop();
        Console.WriteLine($"Serialization took {serializeSw.ElapsedMilliseconds}ms");
        
        var cacheWriteSw = Stopwatch.StartNew();
        await _redisDb.StringSetAsync(cacheKey, serializedIssues, _defaultCacheExpiry);
        cacheWriteSw.Stop();
        Console.WriteLine($"Stored in cache key: {cacheKey} (write took {cacheWriteSw.ElapsedMilliseconds}ms)");
        
        return issues;
    }

    public async Task<IEnumerable<Issue>> GetIssuesByDepartmentIdAsync(int departmentId)
    {
        var issues = await _repository.GetByDepartmentIdAsync(departmentId);
        return issues;
    }

    public async Task<bool> DeleteIssueAsync(string id)
    {
        Console.WriteLine($"DeleteIssueAsync called for ID: {id}");
        var issueToDelete = await _repository.GetByIdAsync(id);
        if (issueToDelete == null)
        {
            Console.WriteLine($"Issue not found for deletion, ID: {id}");
            throw new KeyNotFoundException("Issue not found");
        }
            
        var result = await _repository.DeleteAsync(id);
        Console.WriteLine($"Deletion result from repository: {result}");

        if (result)
        {
            var sw = Stopwatch.StartNew();
            await _redisDb.KeyDeleteAsync(CacheKeyPrefixIssuesAll);
            sw.Stop();
            Console.WriteLine($"Cache invalidated after deleting issue: {id}. Key: {CacheKeyPrefixIssuesAll} (took {sw.ElapsedMilliseconds}ms)");
            _issuesDeletedCounter.Inc();
        }
        return result;
    }

    private async Task DispatchEventsAsync(Issue issue)
    {
        foreach (var @event in issue.Events)
        {
            await _mediator.Publish(@event, CancellationToken.None);
        }
        issue.ClearEvents();
    }

    private JsonSerializerOptions GetJsonSerializerOptions()
    {
        return new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };
    }
}
