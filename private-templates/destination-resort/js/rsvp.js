//update this with your $form selector
var form_id = "rsvp_form";
var sendButton = $("#" + form_id + " [name='send']");

$(document).ready(function () {
  $("#fullName, #email, #numberOfGuests, #message").on(
    "input change",
    function () {
      validateField($(this));
    }
  )
});

function validateField($field) {
  //alert("Validating");
  var value = $field.val().trim();
  var id = $field.attr("id");
  document.getElementById("error_message").innerHTML = "";
  if (id === "email" && !validateEmail(value)) {
    document.getElementById("error_message").innerHTML = "Please enter a valid email address.";
    return false;
  }

  if (!value) {
    document.getElementById("error_message").innerHTML = "Please enter required fields.";
    return false;
  }

  if (id == "numberOfGuests" && !value) {
    document.getElementById("error_message").innerHTML = "Please select no. of guests.";
    return false;
  }

  return true;
}

function validateEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateAllFields() {
  var fullName = document.getElementById("fullName").value;
  var email = document.getElementById("email").value;
  var numberOfGuests = document.getElementById("numberOfGuests").value;

  if (fullName=="" || email=="" || numberOfGuests=="") {
    document.getElementById("error_message").innerHTML = "Please enter required fields.";
    return;
  }
  else if (!validateEmail(email)) {
    document.getElementById("error_message").innerHTML = "Please enter a valid email address.";
    return;
  }
  submitRSVP();
}

function onSuccess() {
    // remove this to avoid redirect
    //window.location = window.location.pathname + "?message=Email+Successfully+Sent%21&isError=0";
    sendButton.val('Submit');
    sendButton.prop('disabled',false);
}

function onError(error) {
    // remove this to avoid redirect
    sendButton.val('Submit');
    sendButton.prop('disabled',false);
    document.getElementById("error_message").innerHTML = JSON.stringify(error);
}

function submitRSVP() {
  //alert("Submitting");
  document.getElementById("send").innerHTML = "Submitting...";
  sendButton.prop('disabled', true);

  var Host_Id = "DT";
  var Name = document.getElementById('fullName').value;
  var Email = document.getElementById('email').value;
  var Guests = document.getElementById('numberOfGuests').value;
  var Message = document.getElementById('message').value;

  // NEW: Get selected radio values
  var Attend = document.querySelector('input[name="attend"]:checked')?.value || "";
  var Food = document.querySelector('input[name="food"]:checked')?.value || "";
  var Days = document.querySelector('input[name="days"]:checked')?.value || "";

  // Combine all into form data
  var formData = "host_id=" + encodeURIComponent(Host_Id) +
                 "&name=" + encodeURIComponent(Name) +
                 "&email=" + encodeURIComponent(Email) +
                 "&guests=" + encodeURIComponent(Guests) +
                 "&attend=" + encodeURIComponent(Attend) +
                 "&food=" + encodeURIComponent(Food) +
                 "&days=" + encodeURIComponent(Days) +
                 "&message=" + encodeURIComponent(Message);

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          document.getElementById("send").innerHTML = "Submitted successfully";
          sendButton.prop('disabled', true);
          //document.getElementById("error_message").innerHTML = JSON.stringify(xmlHttp.responseText);
      } else if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
          document.getElementById("send").innerHTML = "Can't Submit";
          sendButton.prop('disabled', true);
          document.getElementById("error_message").innerHTML = "Your RSVP could not be submitted. Try again. If problem persists, contact the hosts.";
      } else {
          document.getElementById("send").innerHTML = "Submitting...";
          sendButton.prop('disabled', true);
      }
  };
  console.log("RSVP Data:", formData); // <-- Add this here
  xmlHttp.open("GET", "https://rsvp.ospreyinvites.com/handlers/webform_submit.php?" + formData);
  xmlHttp.send(formData);
}

sendButton.on('click', validateAllFields);

var $form = $("#" + form_id);

$form.submit(function( event ) {
    event.preventDefault();
});