using System.ComponentModel.DataAnnotations;

namespace IssueService.DTOs;

public class UpdateStatusRequest
{
    [Required]
    public string Status { get; set; }
} 