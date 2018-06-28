class SessionsController < ApplicationController
  def new
    @user = User.new

  end

  def create
    @user = User.find_by(username: params[:user][:username])
    #authenticate pw
    if @user && @user.authenticate(params[:user][:password])
      session[:user_id] = @user.id
      #when user signs in they will see just their tasks and projects
      redirect_to user_projects_path(@user)
    else
      #redirect to sign in page if authentificatin does not work

      redirect_to new_session_path
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_url
  end
end
