<?php
  use Kaltura\Client\Configuration as KalturaConfiguration;
  use Kaltura\Client\Client as KalturaClient;
  use Kaltura\Client\Enum\SessionType;
  use Kaltura\Client\Plugin\Metadata\Type\MetadataProfileFilter;
  use Kaltura\Client\Type\FilterPager;
  use Kaltura\Client\ApiException;
  use Kaltura\Client\Plugin\MetadataPlugin;

  // load zend framework 2
  require_once(dirname(__FILE__).'/ClassLoader/ClassLoader.php');
  $loader = new Symfony\Component\ClassLoader\ClassLoader();
  $loader->addPrefix('Kaltura', dirname(__FILE__).'/php53/library');
  $loader->register();

  $config = new KalturaConfiguration();
  $config->setServiceUrl('https://www.kaltura.com');
  $client = new KalturaClient($config);
  $ks = $client->generateSession(
      "YOUR_KALTURA_SECRET",
      "YOUR_USER_ID",
      SessionType::ADMIN,
      "YOUR_PARTNER_ID");
  $client->setKS($ks);
  $metadataPlugin = MetadataPlugin::get($client);
  $filter = new MetadataProfileFilter();
  $pager = new FilterPager();

  try {
    $result = $metadataPlugin->metadataProfile->listAction($filter, $pager);
    var_dump($result);
  } catch (Exception $e) {
    echo $e->getMessage();
  }
?>