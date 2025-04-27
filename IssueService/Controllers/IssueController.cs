using IssueService.DTOs;
using IssueService.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

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
[HttpPut("{id}/status")]
public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
{
    await _service.UpdateIssueStatusAsync(id, status);
    return NoContent();
}

}
