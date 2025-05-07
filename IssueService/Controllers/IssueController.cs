using IssueService.DTOs;
using IssueService.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using IssueService.Domain.IssueAggregate;

namespace IssueService.Controllers;

[ApiController]
[Route("issues")]
public class IssueController : ControllerBase
{
    private readonly IIssueService _service;

    public IssueController(IIssueService service)
    {
        _service = service;
    }

    [HttpPost("report")]
    public async Task<IActionResult> Report([FromBody] CreateIssueRequest request)
    {
        var issue = await _service.ReportIssueAsync(request);
        return Ok(issue);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetIssue(string id)
    {
        var issue = await _service.GetIssueByIdAsync(id);
        if (issue == null)
            return NotFound();

        return Ok(issue);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserIssues(string userId)
    {
        var issues = await _service.GetIssuesByUserIdAsync(userId);
        return Ok(issues);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
    {
        if (!Enum.TryParse<IssueStatus>(status, out var issueStatus))
        {
            return BadRequest("Invalid status value");
        }

        await _service.UpdateIssueStatusAsync(id, issueStatus);
        return NoContent();
    }
}
