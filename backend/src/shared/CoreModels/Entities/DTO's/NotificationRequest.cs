using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreModels.Entities.DTO_s
{
    
        public class NotificationDto
        {
            public int NotificationId { get; set; }
            public string? Title { get; set; }
            public string? Message { get; set; }
            public bool IsRead { get; set; }
            public DateTime CreatedOn { get; set; }
        }
    
}
