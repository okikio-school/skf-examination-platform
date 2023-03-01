<script lang="ts">
  import type { User as UserT } from "@supabase/supabase-js";
  import { supabase } from "../../db/client";
  import { getUserName, getUserEmail } from "../../utils/getProfileData";

  import ProfilePicture from "./ProfilePicture.svelte";
  export let isLoggedin = false;
  export let user: UserT | undefined;

  let name = "";
  let currentName = "";
  let email = "";
  let currentEmail = "";
  let formMessage = "";
  let showProfileSection = true;
  let showPasswordSection = false;
  let password = "";
  let confirmPassword = "";

  if (user) {
    name = getUserName(user);
    currentName = getUserName(user);

    email = getUserEmail(user);
    currentEmail = getUserEmail(user);
  }

  async function handleSubmit() {
    if (name === currentName && email === currentEmail) {
      return;
    }
    const { data, error } = await supabase.auth.updateUser({
      email,
      data: { personalized_name: name },
    });

    if (error) {
      console.warn(error);
      formMessage = error.message;
      return;
    }

    formMessage = "Profile updated successfully";

    if (email !== currentEmail) {
      formMessage += ". You will need to verify your email again";
    }

    currentName = getUserName(data.user);
    currentEmail = getUserEmail(data.user);
  }

  async function handlePasswordChange() {
    if (password !== confirmPassword || password.length < 6) {
      formMessage = "Passwords do not match";
      if (password.length < 6) formMessage = "Password is too short";
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.warn(error);
      formMessage = error.message;
      return;
    }

    formMessage = "Password changed successfully";
  }

  function showProfile() {
    showProfileSection = true;
    showPasswordSection = false;
    formMessage = "";
  }

  function showPassword() {
    showProfileSection = false;
    showPasswordSection = true;
    formMessage = "";
  }
</script>

{#if isLoggedin && user}
  <section class="wrapper">
    <div class="info">
      <ProfilePicture {user} />
      <h1>{currentName}</h1>
      <p class="email">{currentEmail}</p>
    </div>
    <main>
      <div class="sidebar">
        <div
          class="sidebar-item"
          on:keypress={showProfile}
          on:click={showProfile}
          class:active={showProfileSection}
        >
          Profile
        </div>
        <div
          class="sidebar-item"
          on:keypress={showPassword}
          on:click={showPassword}
          class:active={showPasswordSection}
        >
          Password
        </div>
      </div>
      {#if showProfileSection}
        <div class="form-profile">
          <!-- change name -->
          <div class="form-name">
            <h2>Username</h2>
            <p>For account, public and certificates</p>
            <label for="name">Full Name</label>
            <input type="text" name="name" id="name" bind:value={name} />
          </div>
          <!-- change email -->
          <div class="form-login">
            <h2>Login</h2>
            <p>Your login credentials</p>
            <label for="email">Email</label>
            <input type="email" name="email" id="email" bind:value={email} />
          </div>

          <button class="submit" type="submit" on:click={handleSubmit}>
            Save
          </button>
          {#if formMessage}
            <div class="message">{formMessage}</div>
          {/if}
        </div>
      {/if}
      {#if showPasswordSection}
        <div class="form-password">
          <h2>Change Password</h2>
          <!-- change password -->
          <div class="form-password-inputs">
            <label for="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              bind:value={password}
            />
            <!-- confirm password -->
            <label for="confirm-password">Confirm Password</label>
            <input
              type="password"
              name="confirm-password"
              id="confirm-password"
              bind:value={confirmPassword}
            />
          </div>
          <button class="submit" type="submit" on:click={handlePasswordChange}>
            Save
          </button>
          {#if formMessage}
            <div class="message">{formMessage}</div>
          {/if}
        </div>
      {/if}
    </main>
  </section>
{/if}

<style>
  section {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    max-width: 768px;
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 4rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .email {
    font-size: 0.8rem;
    color: var(--primary-00);
  }

  main {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 3fr;
    margin-bottom: 8rem;
  }

  .form-profile,
  .form-password {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .form-name,
  .form-login,
  .form-password-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  h2 {
    text-align: left;
    font-size: 2rem;
    color: var(--primary-300);
  }

  .form-name p,
  .form-login p {
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.5rem;
    height: 100%;
    width: 60%;
    border-right: 1px solid var(--primary-300);
  }

  .sidebar-item {
    cursor: pointer;
    user-select: none;
  }

  label {
    font-size: 1rem;
  }

  /* TODO: MOVE TO BASE.CSS */
  input {
    background: rgba(245, 245, 245, 0.1);
    border-radius: 4px;
    height: 32px;
    width: 100%;
    border: none;
    padding: 8px;
    color: var(--text-primary);
  }

  .submit {
    display: flex;
    align-self: start;
  }

  .message {
    display: flex;
    align-self: start;
  }

  @media only screen and (max-width: 768px) {
    .sidebar {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      width: 100%;
      border-right: none;
    }

    main {
      grid-template-columns: 1fr;
      background-color: var(--primary-700);
      padding: 2rem;
      border-radius: 1rem;
    }

    .sidebar-item {
      flex: 1;
      text-align: center;
      padding-bottom: 1rem;
    }

    .sidebar-item.active {
      border-bottom: 1px solid var(--primary-300);
    }

    .form-name {
      padding-top: 1rem;
    }
  }
</style>
