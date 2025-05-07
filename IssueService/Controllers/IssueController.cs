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

    [HttpGet]
    public async Task<IActionResult> GetAllIssues()
    {
        var issues = await _service.GetAllIssuesAsync();
        return Ok(issues);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Status))
        {
            return BadRequest("Status field is required");
        }

        // API'de status değeri string olarak gelir ("0", "1", "2")
        // Bu değeri önce int'e, sonra enum'a dönüştürelim
        if (int.TryParse(request.Status, out int statusValue))
        {
            // Statusun sayısal değere göre enum'a dönüştürülmesi
            IssueStatus issueStatus;
            switch (statusValue)
            {
                case 0:
                    issueStatus = IssueStatus.Pending;
                    break;
                case 1:
                    issueStatus = IssueStatus.InProgress;
                    break;
                case 2:
                    issueStatus = IssueStatus.Resolved;
                    break;
                default:
                    return BadRequest("Invalid status value");
            }

            await _service.UpdateIssueStatusAsync(id, issueStatus);
            return NoContent();
        }

        // Eğer sayı olarak parse edilemezse, enum adıyla parse etmeyi dene
        if (!Enum.TryParse<IssueStatus>(request.Status, out var enumStatus))
        {
            return BadRequest("Invalid status value");
        }

        await _service.UpdateIssueStatusAsync(id, enumStatus);
        return NoContent();
    }

    [HttpGet("department/{departmentId}")]
    public async Task<IActionResult> GetDepartmentIssues(int departmentId)
    {
        var issues = await _service.GetIssuesByDepartmentIdAsync(departmentId);
        return Ok(issues);
    }
}
