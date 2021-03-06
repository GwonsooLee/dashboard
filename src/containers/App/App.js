/*
Copyright 2019-2020 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { hot } from 'react-hot-loader/root';
import {
  Redirect,
  Route,
  HashRouter as Router,
  Switch
} from 'react-router-dom';

import { injectIntl, IntlProvider } from 'react-intl';
import { Content, InlineNotification } from 'carbon-components-react';

import {
  Header,
  LoadingShell,
  LogoutButton,
  PageErrorBoundary
} from '@tektoncd/dashboard-components';
import { getErrorMessage, paths, urls } from '@tektoncd/dashboard-utils';

import {
  About,
  ClusterTasks,
  ClusterTriggerBinding,
  ClusterTriggerBindings,
  Condition,
  Conditions,
  CreateSecret,
  CustomResourceDefinition,
  EventListener,
  EventListeners,
  Extension,
  Extensions,
  ImportResources,
  PipelineResource,
  PipelineResources,
  PipelineRun,
  PipelineRuns,
  Pipelines,
  ReadWriteRoute,
  ResourceList,
  Secret,
  Secrets,
  ServiceAccount,
  ServiceAccounts,
  SideNav,
  TaskRun,
  TaskRuns,
  Tasks,
  TriggerBinding,
  TriggerBindings,
  TriggerTemplate,
  TriggerTemplates
} from '..';

import { fetchExtensions } from '../../actions/extensions';
import { fetchNamespaces, selectNamespace } from '../../actions/namespaces';
import { fetchInstallProperties } from '../../actions/properties';

import {
  getExtensions,
  getLocale,
  getLogoutURL,
  getSelectedNamespace,
  getTenantNamespace,
  isReadOnly,
  isWebSocketConnected
} from '../../reducers';
import messageBundle from '../../nls/messages_en.json';

import '../../components/App/App.scss';

const messages = messageBundle;

/* istanbul ignore next */
if (process.env.I18N_PSEUDO) {
  const startBoundary = '[[%';
  const endBoundary = '%]]';
  // Make it easier to identify untranslated strings in the UI
  Object.keys(messages).forEach(lang => {
    const messagesToDisplay = messages[lang];
    Object.keys(messagesToDisplay).forEach(messageId => {
      if (messagesToDisplay[messageId].startsWith(startBoundary)) {
        // avoid repeating the boundaries when
        // hot reloading in dev mode
        return;
      }
      messagesToDisplay[messageId] = `${startBoundary}${
        messagesToDisplay[messageId]
      }${endBoundary}`;
    });
  });
}

const ConfigErrorComponent = ({ intl, loadingConfigError }) => {
  if (!loadingConfigError) {
    return null;
  }

  return (
    <InlineNotification
      kind="error"
      title={intl.formatMessage({
        id: 'dashboard.app.loadingConfigError',
        defaultMessage: 'Error loading configuration'
      })}
      subtitle={getErrorMessage(loadingConfigError)}
      lowContrast
    />
  );
};

const ConfigError = injectIntl(ConfigErrorComponent);

const initialState = {
  loadingConfigError: null,
  loadingConfig: true
};

export /* istanbul ignore next */ class App extends Component {
  state = initialState;

  componentDidMount() {
    this.fetchConfig();
  }

  componentDidUpdate(prevProps, prevState) {
    const { webSocketConnected } = this.props;
    const { webSocketConnected: prevWebSocketConnected } = prevProps;

    if (webSocketConnected && prevWebSocketConnected === false) {
      this.fetchConfig();
    }

    const { loadingConfig } = this.state;
    const { loadingConfig: prevLoadingConfig } = prevState;

    if (prevLoadingConfig && loadingConfig === false) {
      if (this.props.tenantNamespace) {
        this.props.selectNamespace(this.props.tenantNamespace);
      }

      if (!this.props.tenantNamespace) {
        this.props.fetchNamespaces();
      }

      this.props.fetchExtensions({
        namespace: this.props.tenantNamespace
      });
    }
  }

  componentWillUnmount() {
    this.props.onUnload();
  }

  async fetchConfig() {
    this.setState({ loadingConfig: true });
    try {
      await this.props.fetchInstallProperties();
      this.setState({ loadingConfig: false });
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
      this.setState({ loadingConfigError: error, loadingConfig: false });
    }
  }

  render() {
    const { extensions } = this.props;
    const { loadingConfigError, loadingConfig } = this.state;

    const lang = messages[this.props.lang] ? this.props.lang : 'en';
    const logoutButton = (
      <LogoutButton getLogoutURL={() => this.props.logoutURL} />
    );

    return (
      <IntlProvider locale={lang} defaultLocale="en" messages={messages[lang]}>
        <ConfigError loadingConfigError={loadingConfigError} />

        {loadingConfig && <LoadingShell />}
        {!loadingConfig && (
          <Router>
            <>
              <Header logoutButton={logoutButton} />
              <Route path={paths.byNamespace({ path: '/*' })}>
                {props => <SideNav {...props} />}
              </Route>

              <Content>
                <PageErrorBoundary>
                  <Switch>
                    <Route
                      path={paths.pipelines.all()}
                      exact
                      component={Pipelines}
                    />
                    <Route
                      path={paths.pipelines.byNamespace()}
                      exact
                      component={Pipelines}
                    />
                    <Route
                      path={paths.pipelineRuns.all()}
                      component={PipelineRuns}
                    />
                    <Route
                      path={paths.pipelineRuns.byNamespace()}
                      exact
                      component={PipelineRuns}
                    />
                    <Route
                      path={paths.pipelineRuns.byPipeline()}
                      exact
                      component={PipelineRuns}
                    />
                    <Route
                      path={paths.pipelineRuns.byName()}
                      component={PipelineRun}
                    />
                    <Route
                      path={paths.pipelineResources.all()}
                      exact
                      component={PipelineResources}
                    />
                    <Route
                      path={paths.pipelineResources.byNamespace()}
                      exact
                      component={PipelineResources}
                    />
                    <Route
                      path={paths.pipelineResources.byName()}
                      exact
                      component={PipelineResource}
                    />
                    <Route path={paths.tasks.all()} exact component={Tasks} />
                    <Route
                      path={paths.tasks.byNamespace()}
                      exact
                      component={Tasks}
                    />
                    <Route path={paths.taskRuns.all()} component={TaskRuns} />
                    <Route
                      path={paths.taskRuns.byNamespace()}
                      exact
                      component={TaskRuns}
                    />
                    <Route
                      path={paths.taskRuns.byTask()}
                      exact
                      component={TaskRuns}
                    />
                    <Route
                      path={paths.taskRuns.byName()}
                      exact
                      component={TaskRun}
                    />
                    <Route
                      path={paths.clusterTasks.all()}
                      exact
                      component={ClusterTasks}
                    />
                    <Route
                      path={paths.conditions.all()}
                      component={Conditions}
                    />
                    <Route
                      path={paths.conditions.byNamespace()}
                      exact
                      component={Conditions}
                    />
                    <Route
                      path={paths.conditions.byName()}
                      component={Condition}
                    />

                    <Route path={paths.about()} component={About} />

                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.importResources()}
                      component={ImportResources}
                    />

                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.secrets.all()}
                      exact
                      component={Secrets}
                    />
                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.secrets.byName()}
                      exact
                      component={Secret}
                    />
                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.secrets.byNamespace()}
                      exact
                      component={Secrets}
                    />
                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.secrets.create()}
                      exact
                      component={CreateSecret}
                    />

                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.serviceAccounts.byName()}
                      exact
                      component={ServiceAccount}
                    />
                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.serviceAccounts.all()}
                      exact
                      component={ServiceAccounts}
                    />
                    <ReadWriteRoute
                      isReadOnly={this.props.isReadOnly}
                      path={paths.serviceAccounts.byNamespace()}
                      exact
                      component={ServiceAccounts}
                    />

                    <Route
                      path={paths.eventListeners.all()}
                      exact
                      component={EventListeners}
                    />
                    <Route
                      path={paths.eventListeners.byNamespace()}
                      exact
                      component={EventListeners}
                    />
                    <Route
                      path={paths.eventListeners.byName()}
                      exact
                      component={EventListener}
                    />
                    <Route
                      path={paths.triggerBindings.byName()}
                      exact
                      component={TriggerBinding}
                    />
                    <Route
                      path={paths.triggerBindings.all()}
                      exact
                      component={TriggerBindings}
                    />
                    <Route
                      path={paths.triggerBindings.byNamespace()}
                      exact
                      component={TriggerBindings}
                    />
                    <Route
                      path={paths.clusterTriggerBindings.byName()}
                      exact
                      component={ClusterTriggerBinding}
                    />
                    <Route
                      path={paths.clusterTriggerBindings.all()}
                      exact
                      component={ClusterTriggerBindings}
                    />
                    <Route
                      path={paths.triggerTemplates.byName()}
                      exact
                      component={TriggerTemplate}
                    />
                    <Route
                      path={paths.triggerTemplates.all()}
                      exact
                      component={TriggerTemplates}
                    />
                    <Route
                      path={paths.triggerTemplates.byNamespace()}
                      exact
                      component={TriggerTemplates}
                    />
                    <Route
                      path={paths.extensions.all()}
                      exact
                      component={Extensions}
                    />
                    {extensions
                      .filter(extension => !extension.type)
                      .map(({ displayName, name, source }) => (
                        <Route
                          key={name}
                          path={paths.extensions.byName({ name })}
                          render={({ match }) => (
                            <Extension
                              displayName={displayName}
                              match={match}
                              source={source}
                            />
                          )}
                        />
                      ))}

                    <Route
                      path={paths.kubernetesResources.all()}
                      exact
                      component={ResourceList}
                    />
                    <Route
                      path={paths.kubernetesResources.byNamespace()}
                      exact
                      component={ResourceList}
                    />
                    <Route
                      path={paths.kubernetesResources.byName()}
                      exact
                      component={CustomResourceDefinition}
                    />
                    <Route
                      path={paths.kubernetesResources.cluster()}
                      exact
                      component={CustomResourceDefinition}
                    />
                    <Route
                      path={paths.rawCRD.byNamespace()}
                      exact
                      component={CustomResourceDefinition}
                    />
                    <Route
                      path={paths.rawCRD.cluster()}
                      exact
                      component={CustomResourceDefinition}
                    />

                    <Redirect to={urls.pipelineRuns.all()} />
                  </Switch>
                </PageErrorBoundary>
              </Content>
            </>
          </Router>
        )}
      </IntlProvider>
    );
  }
}

App.defaultProps = {
  extensions: [],
  onUnload: () => {}
};

/* istanbul ignore next */
const mapStateToProps = state => ({
  extensions: getExtensions(state),
  namespace: getSelectedNamespace(state),
  lang: getLocale(state),
  logoutURL: getLogoutURL(state),
  isReadOnly: isReadOnly(state),
  tenantNamespace: getTenantNamespace(state),
  webSocketConnected: isWebSocketConnected(state)
});

const mapDispatchToProps = {
  fetchExtensions,
  fetchNamespaces,
  fetchInstallProperties,
  selectNamespace
};

export default hot(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
