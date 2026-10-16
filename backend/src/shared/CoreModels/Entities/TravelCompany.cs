using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_TravelCompany")]
    public class TravelCompany
    {
        [Key]
        public int TravelCompanyId { get; set; }
        // primary key for travel company

        [Required]
        public int OwnerId { get; set; }
        // reference to the user who owns this company

        [Required, StringLength(150)]
        public string CompanyName { get; set; } = null!;
        // company name with uniqueness applied in DB

        [StringLength(300)]
        public string? Description { get; set; }
        // optional description about the company

        [Required]
        public bool IsActive { get; set; } = true;
        // indicates if company is active in the system

        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);
        // timestamp for creation with IST applied from DB default

        [JsonIgnore]
        [ForeignKey(nameof(OwnerId))]
        public virtual User? Owner { get; set; }
        // navigation reference to owner user

        [JsonIgnore]
        public virtual ICollection<Vehicle>? Vehicle { get; set; }
        // list of vehicles registered under this company

        [JsonIgnore]
        public virtual ICollection<Routes>? Route { get; set; }
        // routes created by this company
    }
}
